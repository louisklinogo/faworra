-- Add invoice template-related fields to invoices table and create invoice_templates table

DO $$ BEGIN
  ALTER TABLE public.invoices
    ADD COLUMN IF NOT EXISTS issue_date timestamptz,
    ADD COLUMN IF NOT EXISTS token text,
    ADD COLUMN IF NOT EXISTS template jsonb,
    ADD COLUMN IF NOT EXISTS from_details jsonb,
    ADD COLUMN IF NOT EXISTS customer_details jsonb,
    ADD COLUMN IF NOT EXISTS payment_details jsonb,
    ADD COLUMN IF NOT EXISTS note_details jsonb,
    ADD COLUMN IF NOT EXISTS top_block jsonb,
    ADD COLUMN IF NOT EXISTS bottom_block jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Helpful index for public link token
CREATE INDEX IF NOT EXISTS idx_invoices_token ON public.invoices (token);

-- Team-scoped invoice templates
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  team_id uuid PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  template jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
