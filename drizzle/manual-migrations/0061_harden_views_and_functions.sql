-- Harden security: make views SECURITY INVOKER and pin function search_path

-- Set all public views/materialized views to run as invoker
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
  LOOP
    BEGIN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', r.relname);
    EXCEPTION WHEN OTHERS THEN
      -- ignore if not supported or already set
      NULL;
    END;
  END LOOP;
END $$;

-- Ensure all public functions use a safe, deterministic search_path
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid, n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path TO pg_catalog, public', r.nspname, r.proname, r.args);
    EXCEPTION WHEN OTHERS THEN
      -- skip functions we cannot alter
      NULL;
    END;
  END LOOP;
END $$;
