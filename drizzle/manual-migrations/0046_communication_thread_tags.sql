-- Communication Thread Tags: many-to-many between communication_threads and tags

CREATE TABLE IF NOT EXISTS communication_thread_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comm_thread_tags_team ON communication_thread_tags(team_id);
CREATE INDEX IF NOT EXISTS idx_comm_thread_tags_thread ON communication_thread_tags(thread_id);
CREATE INDEX IF NOT EXISTS idx_comm_thread_tags_tag ON communication_thread_tags(tag_id);

-- Unique constraint per thread/tag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_comm_thread_tag'
  ) THEN
    ALTER TABLE communication_thread_tags
    ADD CONSTRAINT uq_comm_thread_tag UNIQUE (thread_id, tag_id);
  END IF;
END $$;

-- RLS policies (optional): enable if RLS is turned on; follow existing team scoping
-- ALTER TABLE communication_thread_tags ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY comm_thread_tags_team_access ON communication_thread_tags FOR ALL TO authenticated
-- USING (team_id IN (
--   SELECT team_id FROM users_on_team WHERE user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
-- ));
