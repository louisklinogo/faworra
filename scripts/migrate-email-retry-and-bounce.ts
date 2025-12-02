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

  const filePath = join(import.meta.dir, "..", "drizzle", "manual-migrations", "0052_email_retry_and_bounce.sql");
  const sql = readFileSync(filePath, "utf-8");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("Applying migration 0052_email_retry_and_bounce.sql ...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ Migration 0052 applied successfully");

    // Verify columns exist
    const verify = await client.query(
      `select column_name from information_schema.columns where table_name='communication_outbox' and column_name = any($1) order by column_name`,
      [["last_attempt_at", "next_attempt_at", "provider_message_id", "retry_count"]],
    );
    console.log("Columns present:", verify.rows.map((r) => r.column_name));
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("❌ Migration failed:", (error as any)?.message ?? error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
