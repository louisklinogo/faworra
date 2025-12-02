import { db } from "@Faworra/database/client";
import { getRequestContext, runWithRequestContext } from "@Faworra/database/request-context";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventBus } from "@Faworra/realtime";
import { createNodeEventBus } from "@Faworra/realtime";
import { createEventOutboxBus } from "../lib/event-outbox-bus";
import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { BEARER_PREFIX, DEFAULT_SLOW_MS, REQ_ID_RADIX } from "../lib/http";
import baseLogger from "../lib/logger";
import { createClient } from "../services/supabase";
import { loadApiConfig } from "@Faworra/config";

export type Session = {
  userId: string;
  teamId?: string;
  email?: string;
} | null;

export type TRPCContext = {
  session: Session;
  teamId?: string;
  userId?: string;
  db: typeof db;
  supabase: SupabaseClient;
  locale?: string;
  eventBus: EventBus;
};

export async function createTRPCContext(opts?: FetchCreateContextFnOptions): Promise<TRPCContext> {
  const cfg = loadApiConfig();
  const authHeader = opts?.req?.headers.get("Authorization");
  const token = authHeader?.startsWith(BEARER_PREFIX)
    ? authHeader.substring(BEARER_PREFIX.length)
    : undefined;
  const supabase = createClient();
  // Try to resolve user locale from headers
  const rawLocale =
    opts?.req?.headers.get("x-user-locale") || opts?.req?.headers.get("accept-language") || undefined;
  const locale = normalizeLocale(rawLocale);

  // Try to authenticate via token without relying on cookies
  let session: Session = null;
  if (token) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (!error && user) {
        const userRecord = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, user.id),
        });
        session = {
          userId: user.id,
          email: user.email,
          teamId: userRecord?.currentTeamId || undefined,
        };
      }
    } catch (error) {
      baseLogger.error({ err: error }, "trpc auth error");
    }
  }

  // Configure event bus centrally
  let baseBus: EventBus = createNodeEventBus({ supabase, baseUrl: cfg.realtimeUrl, token: cfg.realtimeToken });
  const useOutbox = cfg.eventOutboxEnabled;
  const eventBus: EventBus = useOutbox ? createEventOutboxBus(db) : baseBus;

  return {
    session,
    teamId: session?.teamId,
    userId: session?.userId,
    supabase,
    db,
    locale,
    eventBus,
  };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Log errors with full details and surface postgres driver fields when present
    const anyErr: any = error as any;
    const cause: any = anyErr?.cause ?? {};
    const pgInfo = typeof cause === "object" && cause
      ? {
          pgCode: cause.code,
          pgDetail: cause.detail,
          pgHint: cause.hint,
          pgPosition: cause.position,
        }
      : undefined;
    baseLogger.error(
      {
        code: error.code,
        message: error.message,
        cause: error.cause,
        ...pgInfo,
        stack: error.stack,
      },
      "tRPC error occurred",
    );
    return shape;
  },
});

function normalizeLocale(input?: string | null) {
  if (!input) return undefined;
  const token = input.split(",")[0]?.trim();
  if (!token) return undefined;
  const valid = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(token);
  return valid ? token : undefined;
}

// Timing middleware (production safe, env-gated)
const timing = t.middleware(async ({ path, type, next }) => {
  const cfg = loadApiConfig();
  const enable = cfg.trpcTiming;
  if (!enable) {
    return next();
  }
  const reqId = Math.random().toString(REQ_ID_RADIX).slice(2);
  const start = Date.now();
  return await runWithRequestContext(
    { reqId, procedure: `${type}:${path}`, startAt: start },
    async () => {
      const result = await next();
      const ms = Date.now() - start;
      const ctx = getRequestContext();
      const q = ctx?.queryCount ?? 0;
      const threshold = Number(cfg.slowProcedureMs ?? DEFAULT_SLOW_MS);
      if (ms >= threshold) {
        baseLogger.warn({ ms, type, path, queries: q }, "trpc slow procedure");
      } else if (cfg.trpcLogAll) {
        baseLogger.info({ ms, type, path, queries: q }, "trpc procedure");
      }
      return result;
    },
  );
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(timing).use(({ ctx, next }) => {
  if (!(ctx.session && ctx.userId)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.userId,
    },
  });
});

export const teamProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.teamId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No team selected. Please select a team first.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      teamId: ctx.teamId,
    },
  });
});
