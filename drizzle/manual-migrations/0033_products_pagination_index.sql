-- Optimize products.list cursor pagination
-- Matches WHERE team_id filter and ORDER BY updated_at DESC, id DESC
-- Use CONCURRENTLY to avoid long locks; partial index excludes soft-deleted rows
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_team_updated_id
ON products (team_id, updated_at DESC, id DESC)
WHERE deleted_at IS NULL;
