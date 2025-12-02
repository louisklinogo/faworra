-- Merge user_invites authenticated policies to avoid multiple permissive SELECT
DO $$
BEGIN
  -- Drop legacy combined ALL policy and email-only SELECT if present
  BEGIN
    DROP POLICY IF EXISTS user_invites_team_rw ON public.user_invites;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN
    DROP POLICY IF EXISTS user_invites_select_by_email ON public.user_invites;
  EXCEPTION WHEN undefined_object THEN NULL; END;

  -- Recreate explicit policies per command
  -- SELECT: allow by team membership OR invitee email match
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
    WHERE c.relname='user_invites' AND p.polname='user_invites_select' AND p.polcmd='r'
  ) THEN
    CREATE POLICY user_invites_select ON public.user_invites
      FOR SELECT TO authenticated
      USING (
        (team_id = ANY (private.get_teams_for_authenticated_user()))
        OR ((((SELECT auth.jwt()) ->> 'email') = email))
      );
  END IF;

  -- INSERT: only by team membership
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
    WHERE c.relname='user_invites' AND p.polname='user_invites_insert' AND p.polcmd='i'
  ) THEN
    CREATE POLICY user_invites_insert ON public.user_invites
      FOR INSERT TO authenticated
      WITH CHECK (team_id = ANY (private.get_teams_for_authenticated_user()));
  END IF;

  -- UPDATE: only by team membership
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
    WHERE c.relname='user_invites' AND p.polname='user_invites_update' AND p.polcmd='w'
  ) THEN
    CREATE POLICY user_invites_update ON public.user_invites
      FOR UPDATE TO authenticated
      USING (team_id = ANY (private.get_teams_for_authenticated_user()))
      WITH CHECK (team_id = ANY (private.get_teams_for_authenticated_user()));
  END IF;

  -- DELETE: only by team membership
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
    WHERE c.relname='user_invites' AND p.polname='user_invites_delete' AND p.polcmd='d'
  ) THEN
    CREATE POLICY user_invites_delete ON public.user_invites
      FOR DELETE TO authenticated
      USING (team_id = ANY (private.get_teams_for_authenticated_user()));
  END IF;
END $$;
