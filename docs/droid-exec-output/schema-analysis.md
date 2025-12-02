# Schema Performance Analysis (Supabase/Postgres)

This report analyzes the current database schema and query patterns for performance, based on the live Supabase‑introspected schema and Drizzle sources in this repository.

Sources analyzed:
- Drizzle schema: `packages/database/src/schema.ts`
- Live (introspected) schema: `drizzle/remote-introspect.ts/schema.ts`
- Migrations: `drizzle/manual-migrations/*.sql`
- Query usage: `packages/database/src/queries/*.ts`, `apps/api/src/trpc/routers/*.ts`, `packages/supabase/src/queries/*.ts`

## Executive Summary (Key Findings)

- Transactions domain is well-indexed for core filters (team, date, status, type, FTS), but several composite indexes can further reduce CPU and I/O for common filtered/sorted lists.
- The enriched transactions list performs post-fetch filtering for tags/attachments in application code; push these to SQL to avoid over-fetching and improve pagination stability.
- Orders pagination uses a cursor on `(created_at, id)` without a matching composite index; add a partial composite index to match the common filter/order.
- Client search relies on multi-column ILIKE; add trigram indexes for phone/whatsapp/email and consider a small FTS vector for consistent performance at scale.
- Use GIN for array columns used in search (documents.path_tokens, measurements.tags). Current BTREE array indexes are suboptimal for containment/overlap operations.
- Make invoice number uniqueness per-team (schema has a non-unique composite; live DB has global unique). Align with multi-tenancy by enforcing `(team_id, invoice_number)` unique.

---

## Table-by-Table Review and Recommendations

### 1) transactions

Observed indexes (migrations + introspection):
- team/date: `idx_transactions_team_date (team_id, date DESC)`
- date columns: `idx_transactions_transaction_date (transaction_date DESC)`, `idx_transactions_date (date DESC)`
- status/type composites: `idx_transactions_team_status_date (team_id, status, date DESC)`, `idx_transactions_team_type_date (team_id, type, date DESC)`
- lookups: `idx_transactions_assigned_id`, `idx_transactions_client_id`, `idx_transactions_account_id`, `idx_transactions_invoice_id`, `idx_transactions_order_id`, `idx_transactions_internal_id`
- pagination: `idx_transactions_team_pagination (team_id, date DESC, id DESC) WHERE deleted_at IS NULL`
- soft-deleted maintenance: `idx_transactions_team_deleted_date (team_id, deleted_at, transaction_date DESC)`
- text search: `idx_transactions_fts` (tsvector), `idx_transactions_name_trgm`, `idx_transactions_description_trgm`

Query patterns (packages/database/src/queries/transactions*.ts):
- Frequent filters by `team_id`, `deleted_at IS NULL`, then optional: `type`, `status[]`, `category_slug`, `assigned_id`, `account_id`, `recurring`, `date range`, `amount range`, case-insensitive search on `name/description/counterparty_name`.
- Sorting/pagination by `date DESC, id DESC`.
- Aggregations for tags (`transaction_tags`), attachments, and allocations; current filtering for `tags` and `hasAttachments` is applied in JS after fetching.

Recommendations:
1) Add composite indexes to match frequent filters with sort:
   ```sql
   -- Category filter + date within a team
   CREATE INDEX IF NOT EXISTS idx_transactions_team_category_date
     ON public.transactions (team_id, category_slug, date DESC)
     WHERE category_slug IS NOT NULL AND deleted_at IS NULL;

   -- Assigned filter + date within a team
   CREATE INDEX IF NOT EXISTS idx_transactions_team_assigned_date
     ON public.transactions (team_id, assigned_id, date DESC)
     WHERE assigned_id IS NOT NULL AND deleted_at IS NULL;

   -- Account filter + date within a team
   CREATE INDEX IF NOT EXISTS idx_transactions_team_account_date
     ON public.transactions (team_id, account_id, date DESC)
     WHERE account_id IS NOT NULL AND deleted_at IS NULL;
   ```
   Rationale: aligns with enriched list filters and preserves the sort order for index-only scans.

2) Push tag and attachment filters into SQL (avoid post-fetch filtering):
   - Tags: add a WHERE EXISTS or HAVING filter:
     ```sql
     -- example predicate to include any of the provided tags
     WHERE EXISTS (
       SELECT 1 FROM transaction_tags tt
       WHERE tt.transaction_id = transactions.id
         AND tt.tag_id = ANY($1::uuid[])
     )
     ```
     Or as aggregation filter:
     ```sql
     HAVING COUNT(DISTINCT CASE WHEN tt.tag_id = ANY($1::uuid[]) THEN tt.tag_id END) > 0
     ```
   - Attachments: use HAVING `COUNT(ta.id) > 0` (or `= 0`) instead of filtering in JS.

3) Validate FTS usage path:
   - Your FTS index on `fts_vector` plus trigram on `name/description` are ideal for `websearch_to_tsquery` and fuzzy matches.
   - Keep `pg_trgm` enabled (already ensured by migration `0015_add_transactions_fts.sql`).

4) Clean up duplicates only if needed:
   - You have both `idx_transactions_date` (DATE) and `idx_transactions_transaction_date` (TIMESTAMPTZ). They serve different purposes; keep both unless one becomes unused.

### 2) transaction_tags, transaction_attachments, transaction_allocations

Observed:
- `transaction_tags`: indexes on `(transaction_id)`, `(tag_id)`, `(team_id)`, unique `(transaction_id, tag_id)`.
- `transaction_attachments`: indexes on `(transaction_id)`, `(team_id)`, `(type)`, `(checksum)`.
- `transaction_allocations`: unique `(transaction_id, invoice_id)` and index on `(invoice_id)`.

Notes:
- The unique composite index on `(transaction_id, invoice_id)` serves lookups by `transaction_id` due to leftmost prefix; ok for joins from transactions.
- For allocation lookups by `invoice_id`, the dedicated index exists.

Action: No new indexes required here beyond pushing filters into SQL in the enriched list (above).

### 3) orders, order_items

Observed indexes:
- `orders`: `(team_id)` (partial where `deleted_at IS NULL` in live), `(created_at)`, status and various activity indexes; per-team sequential numbering via trigger/migration; global unique on `order_number` replaced by per-team unique `uniq_orders_team_order_number` in migration 0021.
- `order_items`: `(order_id)` with a row-level quantity check.

Query pattern (getOrdersWithClients):
- Team-scoped, soft-deleted excluded, cursor on `(created_at, id)` and ordered by `(created_at DESC, id DESC)`.

Recommendation:
```sql
CREATE INDEX IF NOT EXISTS idx_orders_team_created_cursor
  ON public.orders (team_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;
```
Rationale: matches the filter + sort exactly for efficient pagination.

### 4) invoices, invoice_items

Observed:
- Many useful indexes (team_id, order_id, status, created_at, sent_at). Live DB shows a global unique `invoices_invoice_number_key`.
- Drizzle schema has non-unique `uq_invoices_team_invoice (team_id, invoice_number)`.

Recommendation:
```sql
-- Enforce per-team uniqueness instead of global
-- If a global unique on invoice_number exists, drop it first to allow per-team duplicates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='invoices' AND indexname='invoices_invoice_number_key'
  ) THEN
    EXECUTE 'DROP INDEX public.invoices_invoice_number_key';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_invoices_team_invoice
  ON public.invoices (team_id, invoice_number);
```
Rationale: aligns with multi-tenancy and mirrors orders’ numbering approach.

### 5) clients

Observed:
- BTREE indexes on `name`, `phone`, `whatsapp`, `email`, and team; live also has `idx_clients_name_trgm`.

Query pattern (`packages/supabase/src/queries/clients.ts`):
- ILIKE search across `name`, `email`, `phone`, `whatsapp` within a team.

Recommendations:
```sql
-- Ensure pg_trgm is available
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram indexes to support ILIKE on additional columns
CREATE INDEX IF NOT EXISTS idx_clients_phone_trgm
  ON public.clients USING GIN (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_whatsapp_trgm
  ON public.clients USING GIN (whatsapp gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_email_trgm
  ON public.clients USING GIN (email gin_trgm_ops);
```
Optional (FTS): create a generated `clients.fts_vector` on `(name, email)` for consistent ranking and combined search when needed.

### 6) documents

Observed:
- BTREE indexes on `team_id`, `name`, `path_tokens`, `tags`, relations, and timestamps.

Recommendation:
```sql
-- Arrays benefit more from GIN for containment queries
CREATE INDEX IF NOT EXISTS idx_documents_path_tokens_gin
  ON public.documents USING GIN (path_tokens);
```
Consider GIN on `tags` if you frequently filter by tag arrays (currently BTREE array_ops).

### 7) measurements

Observed:
- Several BTREE indexes, including `tags` with `array_ops`.

Recommendation:
```sql
CREATE INDEX IF NOT EXISTS idx_measurements_tags_gin
  ON public.measurements USING GIN (tags);
```
Rationale: improves performance of `tags @> ...` / `&&` style filters.

### 8) communications (threads/messages/outbox)

Observed:
- Thoughtful pagination index for threads: `(team_id, status, last_message_at, id)`; message indexes on `(team_id)`, `(thread_id)`, unique constraints for de-dup.

Action: No changes recommended now; these align with common inbox patterns.

---

## Query-Level Optimizations (Code Changes)

1) getTransactionsEnriched (packages/database/src/queries/transactions-enhanced.ts)
- Current: applies `hasAttachments` and `tags` filtering in JS after aggregation.
- Change: push to SQL.

Drizzle sketch:
```ts
// Build WHERE/HAVING for tags
const where = and(
  eq(transactions.teamId, teamId),
  isNull(transactions.deletedAt),
  /* ...other filters... */
  tagIds?.length ? inArray(transactionTags.tagId, tagIds) : sql`true`,
);

const query = db
  .select({ /* ... */ })
  .from(transactions)
  .leftJoin(transactionTags, eq(transactionTags.transactionId, transactions.id))
  .leftJoin(transactionAttachments, eq(transactionAttachments.transactionId, transactions.id))
  .where(where)
  .groupBy(transactions.id, clients.id, transactionCategories.id, users.id)
  .having(
    hasAttachments === undefined
      ? sql`true`
      : hasAttachments
        ? sql`COUNT(DISTINCT ${transactionAttachments.id}) > 0`
        : sql`COUNT(DISTINCT ${transactionAttachments.id}) = 0`
  )
  .orderBy(desc(transactions.date), desc(transactions.id))
  .limit(limit);
```

Benefits:
- Reduces rows processed/transferred; stabilizes pagination (you won’t return <limit items after client-side filtering).

2) getOrdersWithClients (packages/database/src/queries/orders.ts)
- Add the `idx_orders_team_created_cursor` index (above) to match `(team_id, created_at DESC, id DESC) WHERE deleted_at IS NULL`.

3) Supabase client search (packages/supabase/src/queries/clients.ts)
- With the trigram indexes in place, ILIKE across `name/email/phone/whatsapp` will leverage GIN and stay performant as data grows.

---

## Multi-Tenancy and RLS

- Queries consistently scope by `team_id`; RLS policies exist for major tables in the introspected schema.
- Ensure new indexes include `WHERE deleted_at IS NULL` where appropriate to keep them lean and aligned with read paths.

---

## Housekeeping / Maintenance

- Periodically run `VACUUM (ANALYZE)` or rely on autovacuum; ensure autovacuum thresholds are appropriate for high-churn tables (transactions, transaction_tags, attachments).
- Consider `FILLFACTOR` < 100 for hot-update tables (e.g., transactions) to reduce page splits.
- Monitor `pg_stat_statements` to validate the proposed indexes are used and prune unused/duplicate indexes.

---

## Migration Snippets (ready-to-apply)

Combine the following into an idempotent migration (mirroring the style in `drizzle/manual-migrations/`):

```sql
-- Enable trigram if not already
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Transactions composites for common filters
CREATE INDEX IF NOT EXISTS idx_transactions_team_category_date
  ON public.transactions (team_id, category_slug, date DESC)
  WHERE category_slug IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_team_assigned_date
  ON public.transactions (team_id, assigned_id, date DESC)
  WHERE assigned_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_team_account_date
  ON public.transactions (team_id, account_id, date DESC)
  WHERE account_id IS NOT NULL AND deleted_at IS NULL;

-- Orders cursor index
CREATE INDEX IF NOT EXISTS idx_orders_team_created_cursor
  ON public.orders (team_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

-- Invoices: per-team invoice numbering
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='invoices' AND indexname='invoices_invoice_number_key'
  ) THEN
    EXECUTE 'DROP INDEX public.invoices_invoice_number_key';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_invoices_team_invoice
  ON public.invoices (team_id, invoice_number);

-- Clients search indexes
CREATE INDEX IF NOT EXISTS idx_clients_phone_trgm
  ON public.clients USING GIN (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp_trgm
  ON public.clients USING GIN (whatsapp gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_email_trgm
  ON public.clients USING GIN (email gin_trgm_ops);

-- Array columns -> GIN
CREATE INDEX IF NOT EXISTS idx_documents_path_tokens_gin
  ON public.documents USING GIN (path_tokens);
CREATE INDEX IF NOT EXISTS idx_measurements_tags_gin
  ON public.measurements USING GIN (tags);
```

---

## What Was Verified

- Index and table definitions were cross-checked against `drizzle/remote-introspect.ts/schema.ts` (live Supabase snapshot) and local migrations.
- Query patterns were reviewed in the database query layer and tRPC routers to ensure recommendations match actual usage and sorting.

---

## Next Steps

1) Apply the migration(s) in a staging environment; verify with `EXPLAIN (ANALYZE, BUFFERS)` that scans switch from Seq/Bitmap to Index/Index‑Only where applicable.
2) Update `getTransactionsEnriched` to push tag/attachment predicates into SQL and validate pagination correctness.
3) Monitor `pg_stat_statements` for query timing and index hit ratios; prune or adjust any unused indexes after observation.
