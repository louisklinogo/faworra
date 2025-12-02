-- Speed up chronological message loads within a thread
-- Used by getThreadMessages (ASC created_at)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comm_messages_thread_created_at
  ON communication_messages (team_id, thread_id, created_at ASC, id ASC);
