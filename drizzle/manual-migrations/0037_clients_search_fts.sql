-- Clients Full-Text Search (FTS) setup
-- Safe, idempotent migration for adding tsvector + GIN index + trigger

DO $$ BEGIN
  -- Add tsvector column if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'search_tsv'
  ) THEN
    ALTER TABLE clients ADD COLUMN search_tsv tsvector;
  END IF;
END $$;

-- Create/update trigger function
CREATE OR REPLACE FUNCTION clients_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple',
    coalesce(NEW.name,'') || ' ' ||
    coalesce(NEW.email,'') || ' ' ||
    coalesce(NEW.phone,'') || ' ' ||
    coalesce(NEW.whatsapp,'') || ' ' ||
    coalesce(NEW.company,'')
  );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Ensure trigger in place (fires on relevant column updates)
DROP TRIGGER IF EXISTS trg_clients_tsvector_update ON clients;
CREATE TRIGGER trg_clients_tsvector_update
BEFORE INSERT OR UPDATE OF name, email, phone, whatsapp, company
ON clients
FOR EACH ROW EXECUTE FUNCTION clients_tsvector_update();

-- Backfill existing rows
UPDATE clients SET search_tsv = to_tsvector('simple',
  coalesce(name,'') || ' ' ||
  coalesce(email,'') || ' ' ||
  coalesce(phone,'') || ' ' ||
  coalesce(whatsapp,'') || ' ' ||
  coalesce(company,'')
);

-- Create GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_clients_search_tsv ON clients USING GIN (search_tsv);

-- Helpful btree index for team scoping (if not present)
CREATE INDEX IF NOT EXISTS idx_clients_team_id ON clients (team_id);
