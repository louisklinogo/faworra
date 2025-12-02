-- Drop redundant indexes/constraints on transactions.internal_id
-- 1) Drop plain index concurrently at top-level (cannot run inside DO)
DROP INDEX CONCURRENTLY IF EXISTS public.idx_transactions_internal_id;

-- 2) If two UNIQUE constraints exist on the same column, drop the non-canonical one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid='public.transactions'::regclass AND conname='transactions_internal_id_unique'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid='public.transactions'::regclass AND conname='uq_transactions_internal_id'
  ) THEN
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_internal_id_unique;
  END IF;
END $$;
