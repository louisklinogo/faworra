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
    // 1) Drop plain index concurrently (standalone statement)
    await client.query("DROP INDEX CONCURRENTLY IF EXISTS public.idx_transactions_internal_id");
    console.log("✓ dropped idx_transactions_internal_id (if existed)");

    // 2) If both unique constraints exist, drop the non-canonical one
    const res = await client.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid='public.transactions'::regclass AND conname IN ('transactions_internal_id_unique','uq_transactions_internal_id')
    `);
    const names = res.rows.map((r: any) => r.conname);
    if (names.includes('transactions_internal_id_unique') && names.includes('uq_transactions_internal_id')) {
      await client.query('ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_internal_id_unique');
      console.log('✓ dropped duplicate constraint transactions_internal_id_unique');
    } else {
      console.log('No duplicate unique constraints on transactions.internal_id');
    }
  } finally {
    await client.end();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
