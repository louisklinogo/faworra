-- Documents Full-Text Search (FTS) setup
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'search_tsv'
  ) THEN
    ALTER TABLE documents ADD COLUMN search_tsv tsvector;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION documents_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple',
    coalesce(NEW.name,'') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '),'') || ' ' ||
    coalesce(array_to_string(NEW.path_tokens, ' '),'')
  );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_tsvector_update ON documents;
CREATE TRIGGER trg_documents_tsvector_update
BEFORE INSERT OR UPDATE OF name, tags, path_tokens
ON documents
FOR EACH ROW EXECUTE FUNCTION documents_tsvector_update();

-- Backfill
UPDATE documents SET search_tsv = to_tsvector('simple',
  coalesce(name,'') || ' ' ||
  coalesce(array_to_string(tags, ' '),'') || ' ' ||
  coalesce(array_to_string(path_tokens, ' '),'')
);

-- Index
CREATE INDEX IF NOT EXISTS idx_documents_search_tsv ON documents USING GIN (search_tsv);
