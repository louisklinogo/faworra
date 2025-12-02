#!/usr/bin/env bun

import "dotenv/config";
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
    const pol = await client.query(`
      SELECT p.polname,p.polcmd,p.polpermissive,
             array_agg(r.rolname ORDER BY r.rolname) AS roles,
             pg_get_expr(p.polqual,p.polrelid) AS using_expr,
             pg_get_expr(p.polwithcheck,p.polrelid) AS check_expr
      FROM pg_policy p
      JOIN pg_class cl ON cl.oid=p.polrelid
      JOIN pg_namespace n ON n.oid=cl.relnamespace
      LEFT JOIN pg_roles r ON r.oid = ANY(p.polroles)
      WHERE n.nspname='public' AND cl.relname='user_invites'
      GROUP BY p.polname,p.polcmd,p.polpermissive,p.polqual,p.polwithcheck,p.polrelid
      ORDER BY p.polcmd,p.polname;
    `);
    console.log("user_invites policies:\n", JSON.stringify(pol.rows, null, 2));

    const idx = await client.query(`
      SELECT ci.relname AS index,
             am.amname AS method,
             pg_get_expr(i.indpred,i.indrelid) AS where,
             ARRAY(
               SELECT a.attname
               FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum,ord)
               JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.attnum
               ORDER BY k.ord
             ) AS cols,
             (c.conindid IS NOT NULL) AS is_constraint
      FROM pg_index i
      JOIN pg_class t ON t.oid=i.indrelid
      JOIN pg_namespace ns ON ns.oid=t.relnamespace
      JOIN pg_class ci ON ci.oid=i.indexrelid
      JOIN pg_am am ON am.oid=ci.relam
      LEFT JOIN pg_constraint c ON c.conindid=i.indexrelid
      WHERE ns.nspname='public' AND t.relname='transactions'
      ORDER BY ci.relname;
    `);
    console.log("transactions indexes:\n", JSON.stringify(idx.rows, null, 2));

    const cons = await client.query(`
      SELECT conname,
             contype,
             conindid::regclass::text AS index_name,
             pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = 'public.transactions'::regclass
        AND contype IN ('p','u')
      ORDER BY conname;
    `);
    console.log("transactions constraints:\n", JSON.stringify(cons.rows, null, 2));
  } finally {
    await client.end();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
