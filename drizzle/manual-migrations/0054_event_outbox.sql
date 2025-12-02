CREATE TABLE IF NOT EXISTS event_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  thread_id uuid NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  retry_count integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz NULL,
  next_attempt_at timestamptz NULL,
  delivered_at timestamptz NULL,
  error text NULL,
  idempotency_key text NULL
);

CREATE INDEX IF NOT EXISTS idx_event_outbox_status_next_attempt
  ON event_outbox (status, next_attempt_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_outbox_idempotency
  ON event_outbox (team_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
