#!/usr/bin/env bun

import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

async function run() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error("DATABASE_URL or SUPABASE_DB_URL must be set in .env");
    process.exit(1);
  }

  const filePath = join(import.meta.dir, "..", "drizzle", "manual-migrations", "0054_event_outbox.sql");
  const sql = readFileSync(filePath, "utf-8");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("Applying migration 0054_event_outbox.sql ...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ Migration 0054 applied successfully");
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("❌ Migration failed:", (error as any)?.message ?? error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
