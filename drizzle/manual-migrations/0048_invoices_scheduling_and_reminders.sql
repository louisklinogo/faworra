-- Add scheduling and reminder fields to invoices
-- Safe to run multiple times with IF NOT EXISTS guards

DO $$ BEGIN
  ALTER TABLE public.invoices
    ADD COLUMN IF NOT EXISTS scheduled_send_at timestamptz,
    ADD COLUMN IF NOT EXISTS reminder_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_reminded_at timestamptz;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Helpful indexes for background jobs
CREATE INDEX IF NOT EXISTS idx_invoices_scheduled_send_at ON public.invoices (scheduled_send_at);
CREATE INDEX IF NOT EXISTS idx_invoices_last_reminded_at ON public.invoices (last_reminded_at);
