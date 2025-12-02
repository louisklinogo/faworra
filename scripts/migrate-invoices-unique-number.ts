#!/usr/bin/env bun

import "dotenv/config";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { Client } from "pg";

async function run() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL or SUPABASE_DB_URL must be set in .env");
    process.exit(1);
  }
  const file = join(import.meta.dir, "..", "drizzle", "manual-migrations", "0050_invoices_unique_number.sql");
  const sql = readFileSync(file, "utf-8");
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    console.log("Applying migration 0050_invoices_unique_number.sql ...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ Migration 0050 applied");
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("❌ Migration failed:", (err as any)?.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
