#!/usr/bin/env bun

import "dotenv/config";
import { Client } from "pg";

async function main() {
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ Missing SUPABASE_DB_URL or DATABASE_URL");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const q = `
      SELECT s.schemaname, s.relname AS table, s.indexrelname AS index,
             s.idx_scan, pg_get_indexdef(s.indexrelid) AS indexdef
      FROM pg_stat_user_indexes s
      JOIN pg_index i ON i.indexrelid = s.indexrelid
      LEFT JOIN pg_constraint c ON c.conindid = s.indexrelid
      WHERE s.schemaname = 'public' AND s.idx_scan = 0 AND c.conindid IS NULL
      ORDER BY s.relname, s.indexrelname`;
    const res = await client.query(q);
    if (!res.rowCount) {
      console.log("✅ No unused indexes (idx_scan=0) found.");
      return;
    }
    console.log("Unused indexes (candidates) — not dropped by default:\n");
    for (const r of res.rows) {
      console.log(`- ${r.table}.${r.index} | ${r.indexdef}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
