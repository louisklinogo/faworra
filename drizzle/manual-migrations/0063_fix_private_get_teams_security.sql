-- Ensure private.get_teams_for_authenticated_user runs as invoker (not definer)
DO $$
DECLARE f RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='private' AND p.proname='get_teams_for_authenticated_user'
  ) THEN
    SELECT p.oid, pg_get_function_identity_arguments(p.oid) AS args
    INTO f
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='private' AND p.proname='get_teams_for_authenticated_user'
    ORDER BY p.oid LIMIT 1;
    EXECUTE format('ALTER FUNCTION private.get_teams_for_authenticated_user(%s) SECURITY INVOKER', f.args);
  END IF;
END $$;
