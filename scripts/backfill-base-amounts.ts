#!/usr/bin/env bun

import "dotenv/config";
import { Client } from "pg";

const SQL = `
WITH to_update AS (
  SELECT t.id,
         t.amount,
         t.currency AS tx_currency,
         team.base_currency AS base_currency,
         r.rate,
         r.updated_at
  FROM public.transactions t
  JOIN public.teams team ON team.id = t.team_id
  LEFT JOIN public.exchange_rates r
    ON UPPER(r.base) = UPPER(t.currency)
   AND UPPER(r.target) = UPPER(team.base_currency)
  WHERE (t.base_currency IS NULL OR t.base_amount IS NULL)
)
UPDATE public.transactions AS t
SET base_currency = to_update.base_currency,
    base_amount = CASE
      WHEN to_update.base_currency IS NULL THEN NULL
      WHEN UPPER(to_update.base_currency) = UPPER(to_update.tx_currency) THEN t.amount
      WHEN to_update.rate IS NOT NULL THEN ROUND((t.amount * to_update.rate)::numeric, 2)
      ELSE NULL
    END,
    fx_rate_used = CASE
      WHEN to_update.base_currency IS NULL THEN NULL
      WHEN UPPER(to_update.base_currency) = UPPER(to_update.tx_currency) THEN NULL
      WHEN to_update.rate IS NOT NULL THEN to_update.rate
      ELSE NULL
    END,
    fx_source = CASE
      WHEN to_update.base_currency IS NULL THEN NULL
      WHEN UPPER(to_update.base_currency) = UPPER(to_update.tx_currency) THEN NULL
      WHEN to_update.rate IS NOT NULL THEN 'exchange_rates.table'
      ELSE NULL
    END,
    fx_at = CASE
      WHEN to_update.base_currency IS NULL THEN NULL
      WHEN UPPER(to_update.base_currency) = UPPER(to_update.tx_currency) THEN NULL
      WHEN to_update.rate IS NOT NULL THEN to_update.updated_at
      ELSE NULL
    END
FROM to_update
WHERE t.id = to_update.id;
`;

async function run() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error("DATABASE_URL or SUPABASE_DB_URL must be set in .env");
    process.exit(1);
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("Backfilling base_amount/base_currency on transactions...");
    const res = await client.query(SQL);
    console.log(`✅ Updated ${res.rowCount ?? 0} rows`);
  } catch (err) {
    console.error("❌ Backfill failed:", (err as any)?.message ?? err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
