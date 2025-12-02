-- Increase precision of exchange_rates.rate
ALTER TABLE public.exchange_rates
  ALTER COLUMN rate TYPE numeric(18,8);

-- Add FX audit fields to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS fx_rate_used numeric(18,8),
  ADD COLUMN IF NOT EXISTS fx_source text,
  ADD COLUMN IF NOT EXISTS fx_at timestamptz;

-- Ensure unique internal_id for transactions (matches upsert onConflict)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_transactions_internal_id'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT uq_transactions_internal_id UNIQUE (internal_id);
  END IF;
END $$;
