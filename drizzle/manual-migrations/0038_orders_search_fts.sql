-- Orders Full-Text Search (FTS) setup
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'search_tsv'
  ) THEN
    ALTER TABLE orders ADD COLUMN search_tsv tsvector;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION orders_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple',
    coalesce(NEW.order_number,'') || ' ' ||
    coalesce(NEW.notes,'')
  );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_tsvector_update ON orders;
CREATE TRIGGER trg_orders_tsvector_update
BEFORE INSERT OR UPDATE OF order_number, notes
ON orders
FOR EACH ROW EXECUTE FUNCTION orders_tsvector_update();

-- Backfill
UPDATE orders SET search_tsv = to_tsvector('simple',
  coalesce(order_number,'') || ' ' || coalesce(notes,'')
);

-- Index
CREATE INDEX IF NOT EXISTS idx_orders_search_tsv ON orders USING GIN (search_tsv);
