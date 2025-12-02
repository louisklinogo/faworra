-- Drop duplicate/identical indexes, keeping the canonical versions
-- Use CONCURRENTLY to avoid heavy locks

DROP INDEX CONCURRENTLY IF EXISTS public.idx_products_team_updated_id;

DROP INDEX CONCURRENTLY IF EXISTS public.transactions_team_id_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_transactions_team_date_id;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_transactions_date;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_transactions_description_trigram;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_transactions_name_trigram;

-- For constraint-backed duplicates, drop the redundant UNIQUE constraint instead of the index
ALTER TABLE IF EXISTS public.user_invites DROP CONSTRAINT IF EXISTS uq_user_invites_code;
ALTER TABLE IF EXISTS public.user_invites DROP CONSTRAINT IF EXISTS uq_user_invites_team_email;
