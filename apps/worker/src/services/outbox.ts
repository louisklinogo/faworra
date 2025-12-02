import { createServerClient } from "@Faworra/supabase/server";
import type { Json } from "@Faworra/supabase/types";
import type { EventBus } from "@Faworra/realtime";
import { getRealtimeBus } from "./realtime-bus";
import { Client as PgClient } from "pg";
import { loadWorkerConfig } from "@Faworra/config";
import { getProvider, registerProvider } from "../providers/send-registry";
import { WhatsAppProvider } from "../providers/whatsapp";
import { InstagramProvider } from "../providers/instagram";
import { EmailProvider } from "../providers/email";
import { recordSentMessage, type OutboxJob } from "./outbox-helpers";

const _cfg = loadWorkerConfig();
const OUTBOX_MAX_RETRIES = Math.max(1, Number(_cfg.outboxMaxRetries || 3));
const OUTBOX_RETRY_DELAYS_SECONDS = _cfg.outboxRetryDelaysSeconds;

let outboxTimer: NodeJS.Timeout | null = null;
export function startOutboxPoller() {
  if (outboxTimer) return;
  const cfg = loadWorkerConfig();
  outboxTimer = setInterval(() => {
    processOutboxOnce().catch(() => {});
  }, Math.max(250, cfg.outboxPollMs));
}
export function stopOutboxPoller() {
  if (outboxTimer) {
    clearInterval(outboxTimer);
    outboxTimer = null;
  }
}

export async function processOutboxOnce() {
  const supabase = await createServerClient({ admin: true });
  const nowIso = new Date().toISOString();
  const jobs = await claimOutboxJobs(10);
  let claimed = jobs.length;
  let sentCount = 0;
  let failedCount = 0;
  const startedAt = Date.now();
  for (const job of jobs) {
    const baseRetryCount = Number(job.retry_count ?? 0);
    const attemptNumber = baseRetryCount + 1;
    if (attemptNumber > OUTBOX_MAX_RETRIES) {
      await supabase
        .from("communication_outbox")
        .update({
          status: "dead",
          error: job.error || "max retries exceeded",
          next_attempt_at: null,
          last_attempt_at: nowIso,
          retry_count: baseRetryCount,
        })
        .eq("id", job.id);
      continue;
    }
    const attemptStartedAt = new Date().toISOString();
    const { data: acc } = await supabase
      .from("communication_accounts")
      .select("id, provider, external_id, credentials_encrypted, display_name")
      .eq("id", job.account_id)
      .maybeSingle<{ id: string; provider: string; external_id: string; credentials_encrypted: string | null; display_name: string | null }>();
    if (!acc) continue;
    try {
      if (job.client_message_id) {
        const { data: existing } = await supabase
          .from("communication_messages")
          .select("id, provider_message_id")
          .eq("team_id", job.team_id)
          .eq("client_message_id", job.client_message_id)
          .maybeSingle();
        if (existing?.id) {
          await markOutboxSuccess({
            supabase,
            job,
            attemptNumber: baseRetryCount,
            attemptStartedAt,
            providerMessageId: existing.provider_message_id ?? job.provider_message_id ?? null,
          });
          continue;
        }
      }

      // delegate to provider
      // register built-ins once
      if (!getProvider("whatsapp_baileys")) {
        registerProvider(WhatsAppProvider);
        registerProvider(InstagramProvider);
        registerProvider(EmailProvider);
      }
      const provider = getProvider(acc.provider);
      if (!provider) throw new Error(`unsupported provider: ${acc.provider}`);
      const result = await provider.send({ supabase, account: acc }, job as unknown as OutboxJob);
      const providerMessageId = result.providerMessageId ?? job.provider_message_id ?? null;
      const msgType = result.msgType || "text";
      const recorded = await recordSentMessage(supabase as any, job as any, providerMessageId, msgType, result.threadId);
      if (recorded?.messageId) {
        try {
          const bus = await getRealtimeBus();
          await bus.publish({ type: "message.updated", teamId: job.team_id as string, threadId: recorded.threadId, message: { id: recorded.messageId, status: "sent" } });
        } catch {}
      }

      await markOutboxSuccess({ supabase, job, attemptNumber, attemptStartedAt, providerMessageId });
      sentCount++;
    } catch (e: any) {
      const parsed = parseSendError(e);
      await markOutboxFailure({ supabase, job, attemptNumber, attemptStartedAt, reason: parsed.reason, retryable: parsed.retryable });
      failedCount++;
    }
  }
  const ms = Date.now() - startedAt;
  try {
    const logger = (await import("../logger")).default;
    logger.info({ svc: "outbox", claimed, sent: sentCount, failed: failedCount, ms }, "outbox cycle");
  } catch {}
}

async function claimOutboxJobs(limit = 10): Promise<Array<{
  id: string;
  account_id: string;
  recipient: string;
  content: string | null;
  team_id: string;
  client_message_id: string | null;
  media_path: string | null;
  media_type: string | null;
  media_filename: string | null;
  caption: string | null;
  meta: Json | null;
  retry_count: number | null;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  provider_message_id: string | null;
  error: string | null;
}>> {
  const connStr = loadWorkerConfig().databaseUrl;
  if (!connStr) return [];
  const pg = new PgClient({ connectionString: connStr });
  await pg.connect();
  try {
    const res = await pg.query(
      `WITH cte AS (
         SELECT id
         FROM communication_outbox
         WHERE status = 'queued' AND (next_attempt_at IS NULL OR next_attempt_at <= now())
         ORDER BY next_attempt_at NULLS FIRST, created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       )
       UPDATE communication_outbox o
       SET status = 'processing', last_attempt_at = now()
       FROM cte
       WHERE o.id = cte.id
       RETURNING o.id, o.account_id, o.recipient, o.content, o.team_id, o.client_message_id,
                 o.media_path, o.media_type, o.media_filename, o.caption, o.meta, o.retry_count,
                 o.last_attempt_at, o.next_attempt_at, o.provider_message_id, o.error` ,
      [limit],
    );
    return res.rows as any;
  } finally {
    await pg.end();
  }
}


type SupabaseClientInstance = Awaited<ReturnType<typeof createServerClient>>;

async function markOutboxSuccess(params: { supabase: SupabaseClientInstance; job: any; attemptNumber: number; attemptStartedAt: string; providerMessageId: string | null }) {
  const { supabase, job } = params;
  const currentCount = Number(job.retry_count ?? 0);
  const normalizedAttempt = Number.isFinite(params.attemptNumber) ? Math.max(0, Number(params.attemptNumber)) : currentCount;
  const retryCount = Math.max(currentCount, normalizedAttempt);
  const providerMessageId = params.providerMessageId ?? job.provider_message_id ?? null;
  await supabase
    .from("communication_outbox")
    .update({ status: "sent", error: null, retry_count: retryCount, last_attempt_at: params.attemptStartedAt, next_attempt_at: null, provider_message_id: providerMessageId })
    .eq("id", job.id);
}

async function markOutboxFailure(params: { supabase: SupabaseClientInstance; job: any; attemptNumber: number; attemptStartedAt: string; reason: string; retryable: boolean }) {
  const { supabase, job, reason } = params;
  const currentCount = Number(job.retry_count ?? 0);
  const attempt = Math.max(currentCount + 1, Number(params.attemptNumber) || 0);
  const nextAttemptNumber = attempt + 1;
  const shouldRetry = params.retryable && nextAttemptNumber <= OUTBOX_MAX_RETRIES;
  const nextAttemptAt = shouldRetry ? computeNextAttemptTimestamp(nextAttemptNumber) : null;
  await supabase
    .from("communication_outbox")
    .update({ status: shouldRetry ? "queued" : "dead", error: reason, retry_count: attempt, last_attempt_at: params.attemptStartedAt, next_attempt_at: nextAttemptAt })
    .eq("id", job.id);
}

function computeNextAttemptTimestamp(nextAttemptNumber: number): string {
  if (Number.isNaN(nextAttemptNumber) || nextAttemptNumber <= 1) return new Date(Date.now() + 30_000).toISOString();
  const index = Math.min(Math.max(0, nextAttemptNumber - 2), OUTBOX_RETRY_DELAYS_SECONDS.length - 1);
  const delaySeconds = OUTBOX_RETRY_DELAYS_SECONDS[index] ?? 60;
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

function normalizeSendError(error: unknown): Error {
  if (error instanceof Error) return error;
  const obj = (typeof error === "object" && error) ? (error as Record<string, unknown>) : undefined;
  const baseMessage = (obj && typeof obj.message === "string") ? obj.message : typeof error === "string" ? error : (() => { try { return JSON.stringify(error); } catch { return String(error); } })();
  const err: Error & { statusCode?: number; retryableHint?: boolean } = new Error((baseMessage as string) || "send_error");
  const statusCode = typeof obj?.statusCode === "number" ? (obj.statusCode as number) : (typeof obj?.response === "object" && obj?.response && typeof (obj.response as Record<string, unknown>).status === "number") ? ((obj.response as Record<string, unknown>).status as number) : undefined;
  if (typeof statusCode === "number") err.statusCode = statusCode;
  if (typeof obj?.retryable === "boolean") err.retryableHint = obj.retryable as boolean;
  return err;
}

function parseSendError(error: unknown): { retryable: boolean; reason: string } {
  if (!error) return { retryable: false, reason: "unknown_error" };
  if (typeof error === "object" && error) {
    const obj = error as Record<string, unknown>;
    if (typeof obj.reason === "string" && typeof obj.retryable === "boolean") return { retryable: Boolean(obj.retryable), reason: obj.reason } as { retryable: boolean; reason: string };
  }
  const e2 = error as Partial<Error> & { statusCode?: number; retryableHint?: boolean };
  const statusCode = typeof e2.statusCode === "number" ? e2.statusCode : undefined;
  const retryableHint = typeof e2.retryableHint === "boolean" ? e2.retryableHint : undefined;
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : (() => { try { return JSON.stringify(error); } catch { return String(error); } })();
  if (typeof retryableHint === "boolean") return { retryable: retryableHint, reason: message };
  if (typeof statusCode === "number") {
    if (statusCode >= 500 || statusCode === 429) return { retryable: true, reason: message };
    if (statusCode >= 400 && statusCode < 500) return { retryable: false, reason: message };
  }
  const lower = message.toLowerCase();
  if (lower.includes("timeout") || lower.includes("temporarily") || lower.includes("try again") || lower.includes("rate limit") || lower.includes("network") || lower.includes("econnreset") || lower.includes("socket hang up")) return { retryable: true, reason: message };
  return { retryable: false, reason: message };
}

// centralized bus used
