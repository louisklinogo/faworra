ALTER TABLE communication_outbox
  ADD COLUMN IF NOT EXISTS meta jsonb;
