#!/usr/bin/env bun

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

async function run() {
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ Missing SUPABASE_DB_URL or DATABASE_URL");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const sqlFile = path.resolve(
      process.cwd(),
      "drizzle",
      "manual-migrations",
      "0060_enable_rls_policies.sql",
    );
    const content = fs.readFileSync(sqlFile, "utf8");
    await client.query(content);
    console.log("✅ 0060_enable_rls_policies.sql applied.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
