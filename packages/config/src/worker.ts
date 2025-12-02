import { z } from "zod";

const NumStr = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .transform((v) => (typeof v === "number" ? v : Number(v)));

export const WorkerEnvSchema = z.object({
  DATABASE_URL: z.string().optional(),
  SUPABASE_DB_URL: z.string().optional(),
  EVENT_OUTBOX_ENABLED: z.string().optional(),
  REALTIME_URL: z.string().url().optional(),
  REALTIME_INTERNAL_TOKEN: z.string().optional(),
  WORKER_OUTBOX_POLL_MS: NumStr.optional(),
  WORKER_EVENT_OUTBOX_POLL_MS: NumStr.optional(),
  EVENT_OUTBOX_MAX_RETRIES: NumStr.optional(),
  WORKER_ACCOUNTS_POLL_MS: NumStr.optional(),
  OUTBOX_MAX_RETRIES: NumStr.optional(),
  OUTBOX_RETRY_DELAYS_SECONDS: z.string().optional(),
  INSTAGRAM_ENABLED: z.string().optional(),
  ENABLE_INSTAGRAM_HUMAN_AGENT: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
});

export type WorkerConfig = {
  databaseUrl?: string;
  eventOutboxEnabled: boolean;
  realtimeUrl?: string;
  realtimeToken?: string;
  outboxPollMs: number;
  eventOutboxPollMs: number;
  eventOutboxMaxRetries: number;
  accountsPollMs: number;
  outboxMaxRetries: number;
  outboxRetryDelaysSeconds: number[];
  instagramEnabled: boolean;
  enableInstagramHumanAgent: boolean;
  resendApiKey?: string;
  resendFromEmail?: string;
};

export function loadWorkerConfig(env: Record<string, unknown> = process.env): WorkerConfig {
  const p = WorkerEnvSchema.safeParse(env);
  const e = p.success ? p.data : ({} as any);
  const delays = String(e.OUTBOX_RETRY_DELAYS_SECONDS || "60,180,600,1800,3600")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return {
    databaseUrl: e.DATABASE_URL || e.SUPABASE_DB_URL,
    eventOutboxEnabled: (e.EVENT_OUTBOX_ENABLED || "") === "1" || String(e.EVENT_OUTBOX_ENABLED || "").toLowerCase() === "true",
    realtimeUrl: e.REALTIME_URL,
    realtimeToken: e.REALTIME_INTERNAL_TOKEN,
    outboxPollMs: e.WORKER_OUTBOX_POLL_MS ? Number(e.WORKER_OUTBOX_POLL_MS) : 2000,
    eventOutboxPollMs: e.WORKER_EVENT_OUTBOX_POLL_MS ? Number(e.WORKER_EVENT_OUTBOX_POLL_MS) : 1000,
    eventOutboxMaxRetries: e.EVENT_OUTBOX_MAX_RETRIES ? Number(e.EVENT_OUTBOX_MAX_RETRIES) : 6,
    accountsPollMs: e.WORKER_ACCOUNTS_POLL_MS ? Number(e.WORKER_ACCOUNTS_POLL_MS) : 5000,
    outboxMaxRetries: e.OUTBOX_MAX_RETRIES ? Number(e.OUTBOX_MAX_RETRIES) : 3,
    outboxRetryDelaysSeconds: delays.length ? delays : [60, 180, 600, 1800, 3600],
    instagramEnabled: (e.INSTAGRAM_ENABLED || "") === "true" || String(e.INSTAGRAM_ENABLED || "").toLowerCase() === "true",
    enableInstagramHumanAgent: (e.ENABLE_INSTAGRAM_HUMAN_AGENT || "") === "true" || String(e.ENABLE_INSTAGRAM_HUMAN_AGENT || "").toLowerCase() === "true",
    resendApiKey: e.RESEND_API_KEY,
    resendFromEmail: e.RESEND_FROM_EMAIL,
  };
}
