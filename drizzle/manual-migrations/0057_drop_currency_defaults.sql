-- Drop default currency values; currencies must be set explicitly

-- Teams.base_currency
ALTER TABLE public.teams ALTER COLUMN base_currency DROP DEFAULT;

-- Invoices.currency
ALTER TABLE public.invoices ALTER COLUMN currency DROP DEFAULT;

-- Financial Accounts.currency
ALTER TABLE public.financial_accounts ALTER COLUMN currency DROP DEFAULT;

-- Transactions.currency
ALTER TABLE public.transactions ALTER COLUMN currency DROP DEFAULT;

-- Bank Statements.currency
ALTER TABLE public.bank_statements ALTER COLUMN currency DROP DEFAULT;
