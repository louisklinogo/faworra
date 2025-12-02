#!/usr/bin/env bun

import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL or SUPABASE_DB_URL is required in environment (.env)");
  process.exit(1);
}

async function run() {
  console.log("🚀 Applying Clients FTS migration (tsvector + trigger + GIN)...\n");

  const sql = postgres(DATABASE_URL, { max: 1 });
  try {
    const filePath = join(process.cwd(), "drizzle", "manual-migrations", "0037_clients_search_fts.sql");
    const migrationSQL = readFileSync(filePath, "utf-8");

    console.log("📄 Loaded migration file:", filePath);
    await sql.unsafe(migrationSQL);

    console.log("\n✅ Clients FTS migration applied successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await (sql as any).end?.();
  }
}

run();
