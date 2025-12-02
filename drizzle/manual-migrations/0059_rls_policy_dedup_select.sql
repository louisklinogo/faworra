-- Resolve multiple permissive SELECT policies for role `authenticated`
-- 1) Restrict generic service-role policy to service_role only on specific tables
-- 2) Merge multiple authenticated SELECT policies on user_invites into a single OR policy

DO $$
BEGIN
  -- Restrict the generic policy to service_role only
  PERFORM 1 FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE p.polname = 'Allow all operations for service role' AND n.nspname = 'public' AND c.relname = 'clients';
  IF FOUND THEN
    EXECUTE 'ALTER POLICY "Allow all operations for service role" ON public.clients TO service_role';
  END IF;

  PERFORM 1 FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE p.polname = 'Allow all operations for service role' AND n.nspname = 'public' AND c.relname = 'invoices';
  IF FOUND THEN
    EXECUTE 'ALTER POLICY "Allow all operations for service role" ON public.invoices TO service_role';
  END IF;

  PERFORM 1 FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE p.polname = 'Allow all operations for service role' AND n.nspname = 'public' AND c.relname = 'measurements';
  IF FOUND THEN
    EXECUTE 'ALTER POLICY "Allow all operations for service role" ON public.measurements TO service_role';
  END IF;
END $$;

DO $$
DECLARE
  auth_oid oid;
  cnt int;
  rec RECORD;
  exprs text[] := ARRAY[]::text[];
  combined text;
BEGIN
  SELECT oid INTO auth_oid FROM pg_roles WHERE rolname = 'authenticated';
  IF auth_oid IS NULL THEN
    RAISE NOTICE 'Role authenticated not found; skipping user_invites merge.';
    RETURN;
  END IF;

  SELECT count(*) INTO cnt
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'user_invites'
    AND p.polcmd = 'r' AND p.polpermissive = true
    AND auth_oid = ANY(p.polroles)
    AND p.polname <> 'user_invites_select_merged';

  IF cnt >= 2 THEN
    FOR rec IN
      SELECT p.polname, pg_get_expr(p.polqual, p.polrelid) AS using_expr
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'user_invites'
        AND p.polcmd = 'r' AND p.polpermissive = true
        AND auth_oid = ANY(p.polroles)
        AND p.polname <> 'user_invites_select_merged'
    LOOP
      IF rec.using_expr IS NOT NULL THEN
        exprs := exprs || rec.using_expr;
      END IF;
    END LOOP;

    IF array_length(exprs, 1) IS NOT NULL AND array_length(exprs, 1) > 0 THEN
      combined := '(' || array_to_string(ARRAY(SELECT '(' || e || ')' FROM unnest(exprs) e), ' OR ') || ')';

      -- Drop old policies
      FOR rec IN
        SELECT p.polname
        FROM pg_policy p
        JOIN pg_class c ON c.oid = p.polrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'user_invites'
          AND p.polcmd = 'r' AND p.polpermissive = true
          AND auth_oid = ANY(p.polroles)
          AND p.polname <> 'user_invites_select_merged'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_invites', rec.polname);
      END LOOP;

      -- Create merged policy (idempotent)
      PERFORM 1 FROM pg_policy p
        JOIN pg_class c ON c.oid = p.polrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'user_invites' AND p.polname = 'user_invites_select_merged';
      IF NOT FOUND THEN
        EXECUTE 'CREATE POLICY user_invites_select_merged ON public.user_invites FOR SELECT TO authenticated USING ' || combined;
      ELSE
        EXECUTE 'ALTER POLICY user_invites_select_merged ON public.user_invites USING ' || combined;
      END IF;
    END IF;
  END IF;
END $$;
