-- Performance indexes for outbox claimers

CREATE INDEX IF NOT EXISTS idx_communication_outbox_status_next_attempt
  ON communication_outbox (status, next_attempt_at);

-- Optional: include created_at for ordering if planner prefers
-- CREATE INDEX IF NOT EXISTS idx_communication_outbox_status_next_attempt_created
--   ON communication_outbox (status, next_attempt_at, created_at);
