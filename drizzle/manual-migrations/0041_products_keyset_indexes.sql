-- Products keyset pagination composite index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_products_team_updated_at_id' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_products_team_updated_at_id
      ON public.products (team_id, updated_at DESC, id DESC);
  END IF;
END $$;
