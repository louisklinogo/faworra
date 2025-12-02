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

  const filePath = join(
    import.meta.dir,
    "..",
    "drizzle",
    "manual-migrations",
    "0053_comm_messages_thread_created_at_idx.sql",
  );
  const sql = readFileSync(filePath, "utf-8");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("Applying migration 0053_comm_messages_thread_created_at_idx.sql ...");
    await client.query(sql);
    console.log("✅ Migration 0053 applied successfully");

    const verify = await client.query(
      `select indexname from pg_indexes where schemaname = 'public' and indexname = 'idx_comm_messages_thread_created_at'`,
    );
    console.log("Index present:", verify.rows.length > 0 ? verify.rows[0].indexname : "not found");
  } catch (error) {
    console.error("❌ Migration failed:", (error as any)?.message ?? error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
