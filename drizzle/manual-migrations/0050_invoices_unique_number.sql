-- Team-scoped unique invoice number (partial unique index excluding soft-deleted rows)
DO $$ BEGIN
  -- Drop old non-unique index if present to avoid confusion
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_invoices_team_invoice'
  ) THEN
    DROP INDEX IF EXISTS uq_invoices_team_invoice;
  END IF;
END $$;

-- Create partial unique index for active (non-deleted) invoices
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_team_invoice_active
  ON invoices(team_id, invoice_number)
  WHERE deleted_at IS NULL;
