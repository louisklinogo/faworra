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
    const tables = await client.query(`
      SELECT c.relname AS table,
             c.relrowsecurity AS rls_enabled,
             COALESCE(p.cnt,0) AS policy_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN (
        SELECT polrelid, COUNT(*) AS cnt FROM pg_policy GROUP BY polrelid
      ) p ON p.polrelid = c.oid
      WHERE n.nspname='public' AND c.relkind='r'
      ORDER BY c.relname`);

    const missing = tables.rows.filter((r) => !r.rls_enabled);
    console.log(`RLS disabled tables: ${missing.length}`);
    for (const r of missing) console.log(`- ${r.table} (policies=${r.policy_count})`);

    // Show grants for anon/authenticated on those tables
    if (missing.length) {
      const names = missing.map((r) => r.table);
      const grants = await client.query(
        `SELECT grantee, table_name, privilege_type
         FROM information_schema.role_table_grants
         WHERE table_schema='public' AND table_name = ANY($1::text[])
           AND grantee IN ('anon','authenticated','public')
         ORDER BY table_name, grantee, privilege_type`,
        [names]
      );
      if (grants.rowCount) {
        console.log("\nGrants for anon/authenticated/public on RLS-disabled tables:");
        for (const g of grants.rows) {
          console.log(`- ${g.table_name}: ${g.grantee} -> ${g.privilege_type}`);
        }
      } else {
        console.log("\nNo direct table grants to anon/authenticated/public found (still recommended to enable RLS).");
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
