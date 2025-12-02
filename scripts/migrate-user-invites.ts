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
      "0045_user_invites.sql",
    );
    const content = fs.readFileSync(sqlFile, "utf8");
    console.log("Applying full 0045_user_invites.sql ...");
    await client.query(content);
    console.log("🎉 0045_user_invites.sql applied successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
