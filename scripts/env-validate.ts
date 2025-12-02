#!/usr/bin/env bun
/**
 * Minimal env validation for API/Worker/Realtime using @Faworra/config loaders.
 * Exits 1 if required variables for enabled components are missing.
 */
import { loadApiConfig, loadRealtimeConfig, loadWorkerConfig } from "@Faworra/config";

type Finding = { key: string; message: string };

function checkApi(findings: Finding[]) {
  const cfg = loadApiConfig();
  // If TRPC/API is active (always in this repo), require Supabase server key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) findings.push({ key: "SUPABASE_SERVICE_ROLE_KEY", message: "required for API auth checks" });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) findings.push({ key: "NEXT_PUBLIC_SUPABASE_URL", message: "required for Supabase client" });
  // If outbox enabled, no extra vars; worker handles DATABASE_URL
  if (cfg.realtimeUrl && !cfg.realtimeToken) findings.push({ key: "REALTIME_INTERNAL_TOKEN", message: "recommended when REALTIME_URL is set" });
}

function checkRealtime(findings: Finding[]) {
  const cfg = loadRealtimeConfig();
  if (process.env.REALTIME_PRESENCE === "redis" && !process.env.REDIS_URL) {
    findings.push({ key: "REDIS_URL", message: "required when REALTIME_PRESENCE=redis" });
  }
  // Token is required only if the /events endpoint is protected (recommended)
  if (!cfg.internalToken) findings.push({ key: "REALTIME_INTERNAL_TOKEN", message: "recommended to protect /events endpoint" });
}

function checkWorker(findings: Finding[]) {
  const cfg = loadWorkerConfig();
  if (!cfg.databaseUrl) findings.push({ key: "DATABASE_URL|SUPABASE_DB_URL", message: "one of these must be set for outbox/event-outbox" });
}

const findings: Finding[] = [];
checkApi(findings);
checkRealtime(findings);
checkWorker(findings);

if (findings.length) {
  console.error("\n❌ Environment validation failed. Missing/invalid variables:");
  for (const f of findings) console.error(` - ${f.key}: ${f.message}`);
  console.error("\nSet these variables locally or via Doppler/CI secrets.");
  process.exit(1);
} else {
  console.log("✅ Environment validation passed (API/Worker/Realtime)");
}
