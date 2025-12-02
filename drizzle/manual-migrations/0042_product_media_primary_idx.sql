-- Product media primary image fast lookup index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_product_media_primary' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_product_media_primary
      ON public.product_media (
        team_id,
        product_id,
        is_primary DESC,
        position NULLS LAST,
        created_at DESC
      );
  END IF;
END $$;
