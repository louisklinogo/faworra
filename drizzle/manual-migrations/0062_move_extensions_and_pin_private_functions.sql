-- Move extensions out of public and pin search_path for private schema functions

-- 1) Create dedicated extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2) Move relocatable extensions to 'extensions' schema if currently in 'public'
DO $$
DECLARE ext RECORD;
BEGIN
  FOR ext IN SELECT e.oid, e.extname, n.nspname AS schema
             FROM pg_extension e
             JOIN pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname IN ('pg_trgm','unaccent')
  LOOP
    IF ext.schema = 'public' THEN
      EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext.extname);
    END IF;
  END LOOP;
END $$;

-- 3) Pin search_path for all user-defined functions in schema 'private'
DO $$
DECLARE r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='private') THEN
    FOR r IN
      SELECT p.oid, n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'private'
        AND NOT EXISTS (
          SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
        )
    LOOP
      BEGIN
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path TO pg_catalog, public, private', r.nspname, r.proname, r.args);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END LOOP;
  END IF;
END $$;
