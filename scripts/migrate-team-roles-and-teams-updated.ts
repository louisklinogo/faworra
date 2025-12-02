#!/usr/bin/env bun
import "dotenv/config";

async function run() {
  const { Client } = await import("pg");
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error("DATABASE_URL or SUPABASE_DB_URL not set in environment");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("BEGIN");
    // 1) Ensure enum exists
    const typeExists = await client.query(
      "SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'team_role' AND n.nspname = 'public'",
    );
    if (typeExists.rowCount === 0) {
      await client.query(
        "CREATE TYPE public.team_role AS ENUM ('owner','admin','agent','viewer')",
      );
    }

    // 2) users_on_team.role -> team_role
    await client.query(
      "ALTER TABLE public.users_on_team ALTER COLUMN role TYPE public.team_role USING role::public.team_role",
    );

    // 3) team_memberships.role alignment (if table exists)
    const tmExist = await client.query(
      "SELECT to_regclass('public.team_memberships') as oid",
    );
    if (tmExist.rows?.[0]?.oid) {
      await client.query(
        "ALTER TABLE public.team_memberships DROP CONSTRAINT IF EXISTS chk_team_memberships_role",
      );
      await client.query("UPDATE public.team_memberships SET role='admin' WHERE role='manager'");
      await client.query("UPDATE public.team_memberships SET role='viewer' WHERE role='custom'");
      await client.query(
        "UPDATE public.team_memberships SET role='viewer' WHERE role NOT IN ('owner','admin','agent','viewer')",
      );
      await client.query(
        "ALTER TABLE public.team_memberships ALTER COLUMN role TYPE public.team_role USING role::public.team_role",
      );
    }

    // 4) teams.updated_at column
    await client.query(
      "ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()",
    );

    // 5) updated_at trigger on teams
    await client.query(
      "CREATE OR REPLACE FUNCTION public.set_row_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$",
    );
    const trg = await client.query(
      "SELECT 1 FROM pg_trigger WHERE tgname='trg_teams_updated_at' AND tgrelid='public.teams'::regclass",
    );
    if (trg.rowCount === 0) {
      await client.query(
        "CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at()",
      );
    }
    await client.query("COMMIT");
    console.log("✅ Applied migration 0043_roles_enum_alignment_and_teams_updated_at.sql");
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err?.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
