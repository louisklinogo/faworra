#!/usr/bin/env bun

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

async function run() {
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error("❌ DATABASE_URL or SUPABASE_DB_URL is required in environment (.env)");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const sqlFile = path.resolve(
      process.cwd(),
      "drizzle",
      "manual-migrations",
      "0044_product_media_indexes.sql",
    );
    const content = fs.readFileSync(sqlFile, "utf8");
    // Split statements to ensure each CREATE INDEX CONCURRENTLY runs outside an explicit transaction
    const statements = content
      .split(";\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      console.log("Applying:", stmt.slice(0, 120).replace(/\s+/g, " "), "...");
      await client.query(stmt);
      console.log("✅ Done");
    }
    console.log("🎉 0044_product_media_indexes.sql applied successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
