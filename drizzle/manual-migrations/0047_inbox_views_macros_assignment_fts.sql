-- Add snoozed_until to communication_threads
ALTER TABLE communication_threads
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz NULL;

-- Add search_tsv to communication_messages and GIN index + trigger
ALTER TABLE communication_messages
  ADD COLUMN IF NOT EXISTS search_tsv tsvector;

UPDATE communication_messages
SET search_tsv = to_tsvector('simple', COALESCE(content, ''))
WHERE search_tsv IS NULL;

CREATE INDEX IF NOT EXISTS idx_comm_messages_search_tsv
  ON communication_messages USING GIN (search_tsv);

DROP TRIGGER IF EXISTS comm_messages_search_tsv_trigger ON communication_messages;
CREATE TRIGGER comm_messages_search_tsv_trigger
BEFORE INSERT OR UPDATE ON communication_messages
FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('search_tsv', 'pg_catalog.simple', 'content');

-- Saved inbox views
CREATE TABLE IF NOT EXISTS saved_inbox_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_views_team ON saved_inbox_views(team_id);

-- Assignment policies
CREATE TABLE IF NOT EXISTS assignment_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  policy text NOT NULL,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_policies_team ON assignment_policies(team_id);

-- Macros
CREATE TABLE IF NOT EXISTS macros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_macros_team ON macros(team_id);
