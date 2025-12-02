-- Ensure efficient lookups for media primary selection and ordering
-- Use CONCURRENTLY to avoid long write locks in production
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_media_team_product_primary
  ON product_media (team_id, product_id, is_primary);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_media_team_product_order
  ON product_media (team_id, product_id, position DESC, created_at DESC);
