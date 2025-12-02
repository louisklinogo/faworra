-- 0043_roles_enum_alignment_and_teams_updated_at.sql
-- Idempotent alignment of team role enum usage and teams.updated_at column

-- 1) Ensure team_role enum exists (owner|admin|agent|viewer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'team_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.team_role AS ENUM ('owner','admin','agent','viewer');
  END IF;
END $$ LANGUAGE plpgsql;

-- 2) Align users_on_team.role to team_role enum (if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users_on_team' AND column_name='role'
  ) THEN
    -- Change type only if not already team_role
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='users_on_team' AND column_name='role' AND udt_name <> 'team_role'
    ) THEN
      ALTER TABLE public.users_on_team
        ALTER COLUMN role TYPE public.team_role USING role::public.team_role;
    END IF;
  END IF;
END $$ LANGUAGE plpgsql;

-- 3) Align team_memberships.role to team_role enum (if table present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'team_memberships' AND n.nspname = 'public'
  ) THEN
    -- Drop legacy CHECK if present
    IF EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname='chk_team_memberships_role'
    ) THEN
      ALTER TABLE public.team_memberships DROP CONSTRAINT chk_team_memberships_role;
    END IF;

    -- Map legacy values to enum set
    UPDATE public.team_memberships SET role='admin' WHERE role='manager';
    UPDATE public.team_memberships SET role='viewer' WHERE role='custom';
    UPDATE public.team_memberships SET role='viewer' WHERE role NOT IN ('owner','admin','agent','viewer');

    -- Change type only if not already team_role
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='team_memberships' AND column_name='role' AND udt_name <> 'team_role'
    ) THEN
      ALTER TABLE public.team_memberships
        ALTER COLUMN role TYPE public.team_role USING role::public.team_role;
    END IF;
  END IF;
END $$ LANGUAGE plpgsql;

-- 4) Ensure teams.updated_at column exists (default now, not null)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='teams' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$ LANGUAGE plpgsql;

-- 5) Create a generic updated_at trigger on teams (optional, idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'set_row_updated_at' AND n.nspname = 'public'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_row_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql AS $$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $$;
  END IF;
END $$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='trg_teams_updated_at' AND tgrelid='public.teams'::regclass
  ) THEN
    CREATE TRIGGER trg_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.set_row_updated_at();
  END IF;
END $$ LANGUAGE plpgsql;
