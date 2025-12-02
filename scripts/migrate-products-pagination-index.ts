#!/usr/bin/env bun

import "dotenv/config";
import fs from "fs";
import path from "path";
import { Client } from "pg";

async function run() {
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const sqlFile = path.resolve(
      process.cwd(),
      "drizzle",
      "manual-migrations",
      "0033_products_pagination_index.sql",
    );
    const content = fs.readFileSync(sqlFile, "utf8");
    // Run index creation without wrapping in a transaction since CONCURRENTLY is used
    await client.query(content);
    console.log("0033 products pagination index migration applied.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
