import { z } from "zod";

const Port = z
  .union([z.number().int().min(1).max(65535), z.string().regex(/^\d+$/)])
  .transform((v) => (typeof v === "number" ? v : Number(v)))
  .pipe(z.number().int().min(1).max(65535));

export const RealtimeEnvSchema = z.object({
  REALTIME_PORT: Port.optional().default(3010 as any),
  REALTIME_INTERNAL_TOKEN: z.string().optional(),
  REALTIME_CORS_ORIGINS: z.string().optional(),
  REALTIME_PRESENCE: z.enum(["redis"]).optional(),
  REDIS_URL: z.string().optional(),
  DASHBOARD_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

export type RealtimeConfig = {
  port: number;
  internalToken?: string;
  corsOrigins: string[];
  presenceBackend: "redis" | "memory";
  redisUrl?: string;
  dashboardUrl?: string;
  publicAppUrl?: string;
};

export function loadRealtimeConfig(env: Record<string, unknown> = process.env): RealtimeConfig {
  const parsed = RealtimeEnvSchema.safeParse(env);
  if (!parsed.success) {
    // Be lenient: fall back to defaults when validation fails
    return {
      port: Number(process.env.REALTIME_PORT || 3010),
      internalToken: process.env.REALTIME_INTERNAL_TOKEN,
      corsOrigins: String(process.env.REALTIME_CORS_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      presenceBackend: process.env.REALTIME_PRESENCE === "redis" ? "redis" : "memory",
      redisUrl: process.env.REDIS_URL,
      dashboardUrl: process.env.DASHBOARD_URL,
      publicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    };
  }
  const v = parsed.data;
  const cors = (v.REALTIME_CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    port: v.REALTIME_PORT as unknown as number,
    internalToken: v.REALTIME_INTERNAL_TOKEN,
    corsOrigins: cors,
    presenceBackend: v.REALTIME_PRESENCE === "redis" ? "redis" : "memory",
    redisUrl: v.REDIS_URL,
    dashboardUrl: v.DASHBOARD_URL,
    publicAppUrl: v.NEXT_PUBLIC_APP_URL,
  };
}
