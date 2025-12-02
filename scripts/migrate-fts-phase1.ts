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

async function apply(file: string, sqlClient: any) {
  const fullPath = join(process.cwd(), "drizzle", "manual-migrations", file);
  const sql = readFileSync(fullPath, "utf-8");
  console.log(`\n📄 Applying ${file} ...`);
  await sqlClient.unsafe(sql);
  console.log(`✅ ${file} applied.`);
}

async function run() {
  console.log("🚀 Applying FTS Phase 1 (orders, products, documents) ...\n");
  const sql = postgres(DATABASE_URL, { max: 1 });
  try {
    await apply("0038_orders_search_fts.sql", sql);
    await apply("0039_products_search_fts.sql", sql);
    await apply("0040_documents_search_fts.sql", sql);
    console.log("\n🎉 Phase 1 FTS migrations completed.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await (sql as any).end?.();
  }
}

run();
