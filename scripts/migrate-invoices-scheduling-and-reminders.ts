#!/usr/bin/env bun

import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

async function run() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL or SUPABASE_DB_URL must be set in .env");
    process.exit(1);
  }

  const sqlPath = join(
    import.meta.dir,
    "..",
    "drizzle",
    "manual-migrations",
    "0048_invoices_scheduling_and_reminders.sql",
  );

  const sql = readFileSync(sqlPath, "utf-8");

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    console.log("Applying migration 0048_invoices_scheduling_and_reminders.sql ...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ Migration applied");

    const check = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema='public' AND table_name='invoices'
       AND column_name IN ('scheduled_send_at','reminder_count','last_reminded_at')
       ORDER BY column_name;`,
    );
    console.log(
      `Columns present: ${check.rows.map((r) => r.column_name).join(", ") || "<none>"}`,
    );
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("❌ Migration failed:", (err as any)?.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
