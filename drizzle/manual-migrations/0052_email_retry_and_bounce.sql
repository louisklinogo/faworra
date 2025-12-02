ALTER TYPE "comm_message_status" ADD VALUE IF NOT EXISTS 'bounced';

ALTER TABLE "communication_outbox"
  ADD COLUMN IF NOT EXISTS "retry_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "last_attempt_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "next_attempt_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "provider_message_id" text;

CREATE INDEX IF NOT EXISTS "idx_comm_outbox_status_next_attempt"
  ON "communication_outbox" ("status", "next_attempt_at");

CREATE INDEX IF NOT EXISTS "idx_comm_outbox_provider_message_id"
  ON "communication_outbox" ("provider_message_id");
