import { z } from "zod";

const BoolStr = z.string().transform((v) => v === "1" || v.toLowerCase() === "true").or(z.boolean());
const NumStr = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .transform((v) => (typeof v === "number" ? v : Number(v)));

export const ApiEnvSchema = z.object({
  EVENT_OUTBOX_ENABLED: z.string().optional(),
  REALTIME_URL: z.string().url().optional(),
  REALTIME_INTERNAL_TOKEN: z.string().optional(),
  API_PORT: NumStr.optional(),
  API_CORS_ORIGINS: z.string().optional(),
  TRPC_TIMING: z.string().optional(),
  TRPC_LOG_ALL: z.string().optional(),
  SLOW_PROCEDURE_MS: NumStr.optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export type ApiConfig = {
  eventOutboxEnabled: boolean;
  realtimeUrl?: string;
  realtimeToken?: string;
  apiPort?: number;
  corsOrigins: string[];
  trpcTiming: boolean;
  trpcLogAll: boolean;
  slowProcedureMs?: number;
};

export function loadApiConfig(env: Record<string, unknown> = process.env): ApiConfig {
  const p = ApiEnvSchema.safeParse(env);
  const e = p.success ? p.data : ({} as any);
  const cors = String(e.API_CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    eventOutboxEnabled: (e.EVENT_OUTBOX_ENABLED || "") === "1" || String(e.EVENT_OUTBOX_ENABLED || "").toLowerCase() === "true",
    realtimeUrl: e.REALTIME_URL,
    realtimeToken: e.REALTIME_INTERNAL_TOKEN,
    apiPort: e.API_PORT ? Number(e.API_PORT) : undefined,
    corsOrigins: cors,
    trpcTiming: (e.TRPC_TIMING || "") === "1" || String(e.TRPC_TIMING || "").toLowerCase() === "true",
    trpcLogAll: (e.TRPC_LOG_ALL || "") === "1" || String(e.TRPC_LOG_ALL || "").toLowerCase() === "true",
    slowProcedureMs: e.SLOW_PROCEDURE_MS ? Number(e.SLOW_PROCEDURE_MS) : undefined,
  };
}
