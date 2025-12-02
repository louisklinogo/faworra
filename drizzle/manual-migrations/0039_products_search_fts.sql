-- Products Full-Text Search (FTS) setup
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'search_tsv'
  ) THEN
    ALTER TABLE products ADD COLUMN search_tsv tsvector;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION products_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple',
    coalesce(NEW.name,'') || ' ' ||
    coalesce(NEW.slug,'') || ' ' ||
    coalesce(NEW.description,'')
  );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_tsvector_update ON products;
CREATE TRIGGER trg_products_tsvector_update
BEFORE INSERT OR UPDATE OF name, slug, description
ON products
FOR EACH ROW EXECUTE FUNCTION products_tsvector_update();

-- Backfill
UPDATE products SET search_tsv = to_tsvector('simple',
  coalesce(name,'') || ' ' || coalesce(slug,'') || ' ' || coalesce(description,'')
);

-- Index
CREATE INDEX IF NOT EXISTS idx_products_search_tsv ON products USING GIN (search_tsv);
