-- Create user_invites table to support team invitations
-- Parity with Midday: unique(team_id, email), optional code, invited_by fk

CREATE TABLE IF NOT EXISTS user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role team_role NOT NULL,
  code text,
  invited_by uuid REFERENCES users(id) ON DELETE CASCADE
);

-- Unique composite team_id + email to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_invites_team_email'
  ) THEN
    ALTER TABLE user_invites ADD CONSTRAINT uq_user_invites_team_email UNIQUE (team_id, email);
  END IF;
END $$;

-- Optional unique code (if used for link-based joins)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_invites_code'
  ) THEN
    ALTER TABLE user_invites ADD CONSTRAINT uq_user_invites_code UNIQUE (code);
  END IF;
END $$;

-- Team index for faster lists
CREATE INDEX IF NOT EXISTS user_invites_team_id_idx ON user_invites (team_id);

-- RLS policies (optional): follow Supabase JWT email; enable as needed
-- COMMENTED OUT by default; uncomment if RLS is enabled and desired
-- ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY user_invites_select_by_email ON user_invites FOR SELECT TO authenticated
-- USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'email') = email);
-- CREATE POLICY user_invites_team_member_crud ON user_invites FOR ALL TO authenticated
-- USING (team_id IN (SELECT team_id FROM users_on_team WHERE user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid));
