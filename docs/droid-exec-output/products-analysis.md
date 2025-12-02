# Products Feature Audit – Performance, UX, and Architecture

Date: 2025-10-24
Branch: feature/transactions-search-filter
Scope: Frontend (Products pages/components), API (tRPC + REST), DB schema/queries

---

## Executive Summary

- The Products list follows the Server→Client initialData pattern and feels aligned with project guidelines. However, ProductSheet opens slower than expected primarily due to an unconditional teams.current fetch (currency) on mount, repeated details fetches, and heavy client-side imports bundled into the sheet path.
- tRPC logs show products.details is the top latency contributor (avg ~1.25s; 7 calls), with teams.current (~0.71s) and productCategories.list (~0.36s) also notable. These calls commonly occur around sheet interactions (edit/new, category create, inventory).
- Media model is close but stores public URLs into product_media.path in the UI, which limits future flexibility (signed URLs/private buckets) and conflicts with the storage path returned by the REST upload endpoint. No DB constraint enforces “one primary per product/variant”; reordering is simplistic and can lead to duplicate positions.
- Integration readiness with Shopify/Medusa is good at a high level (products, variants, media, inventory locations) but missing essentials like variant options modeling, external IDs per system, and sync cursors.

---

## Current Architecture Overview

- Server component page: `apps/dashboard/src/app/(dashboard)/products/page.tsx` fetches initial products via `getProductsEnriched` and passes as `initialProducts` to the client view.
- Client orchestrator: `products-view.tsx` renders table, uses TRPC `products.list` with initialData, and conditionally shows `<ProductSheet />` based on URL query.
- ProductSheet: `product-sheet.tsx` handles create/edit, variant and inventory editing, and media management. Section-gated queries for media/inventory; category list always fetched; currency from `useTeamCurrency`.
- API: `apps/api/src/trpc/routers/products.ts` exposes list/details CRUD, variant CRUD, media CRUD, and inventory CRUD; `apps/api/src/rest/products.ts` provides uploads to Supabase storage bucket (public read).
- DB: `packages/database/src/schema.ts` models products, product_variants, product_inventory, product_categories, product_media; queries in `packages/database/src/queries/products.ts` and `product-categories.ts`. Performance indexes exist in `drizzle/manual-migrations/0031_products_perf_indexes.sql`.

---

## Measured Findings

### 1) ProductSheet open (new/edit)

Observed network calls around sheet interactions (from logs and code analysis):
- New product open: typically triggers `teams.current` (currency) and `productCategories.list`. Product data not fetched.
- Edit product open: adds product fetch (either `products.byId` or `products.details` if used). Sections gate additional calls (media/inventory) only when expanded.

Proxy timings from tRPC logs (see summary below):
- `teams.current` avg ~714.5ms (n=4)
- `productCategories.list` avg ~363.3ms (n=3)
- `products.details` avg ~1248.3ms (n=7; two DB queries per call)

Time-to-open approximation (without browser tooling):
- New: dominated by `teams.current` and `productCategories.list` (concurrent). Expect ~0.7–1.1s until dependent UI fully ready.
- Edit: `products.details` becomes dominant; effective latency ~1.2–1.6s before details-dependent controls stabilize.

Bundle/hydration notes (heavy imports in sheet path):
- `react-dropzone` imported at top-level in ProductSheet: `apps/.../product-sheet.tsx:22`
- `@Faworra/supabase/client` imported at top-level in ProductSheet: `apps/.../product-sheet.tsx:23`
- `cmdk` used by ComboboxDropdown (category picker) via `apps/dashboard/src/components/ui/combobox-dropdown.tsx`
- `react-hook-form` + `zod` in ProductSheet
- ProductSheet is statically imported by `products-view.tsx`, so the Products page bundle includes Sheet code even when closed. This increases initial JS and hydration work for the list view.

Hydration/render patterns:
- ProductsView statically imports ProductSheet; sheet component is toggled at runtime via a query param. This forgoes code-splitting and increases initial hydration cost.
- Category list query fires on every sheet mount (even if the Category section isn’t interacted with). Currency fetch via `useTeamCurrency()` runs unconditionally.

### 2) tRPC timing summary

Command executed: `bun scripts/analyze-trpc-logs.ts`

Top-20 (avg, count, min..max):

```
query:products.details                   avg=1248.3ms  n=7  [703..2117]
mutation:products.mediaAddMany           avg=728.0ms  n=1  [728..728]
mutation:productCategories.create        avg=725.0ms  n=1  [725..725]
query:teams.current                      avg=714.5ms  n=4  [709..722]
query:products.inventoryLocations        avg=414.7ms  n=3  [357..467]
mutation:products.create                 avg=386.0ms  n=1  [386..386]
mutation:products.variantCreate          avg=383.0ms  n=2  [365..401]
query:products.list                      avg=376.0ms  n=3  [356..400]
query:productCategories.list             avg=363.3ms  n=3  [351..375]
mutation:products.update                 avg=363.0ms  n=2  [356..370]
mutation:products.variantUpdate          avg=363.0ms  n=1  [363..363]
query:products.inventoryByVariant        avg=361.7ms  n=3  [353..372]
query:products.mediaList                 avg=355.0ms  n=1  [355..355]
```

Commentary:
- `products.details` (two DB roundtrips: product + variants) is the biggest contributor and likely what makes edit-sheet open feel slow, especially if called multiple times (prefetch + on open + after mutations invalidate/refetch).
- `teams.current` is slower than expected and is used widely via `useTeamCurrency`; it performs 2 DB queries (user → team, then team → baseCurrency).
- `productCategories.list` contributes consistent ~350ms per call; it’s fired on each sheet mount.
- Inventory and media queries are section-gated (good), but when opened, add ~350–470ms each.

---

## What’s Working Well

- Server-first list page with `initialData` via `getProductsEnriched` adheres to the project’s data flow pattern.
- Products list columns show primary image via subquery and aggregate price/stock efficiently.
- Sheet uses section-gated queries for Media and Inventory; Inventory locations cached with `staleTime: Infinity`.
- Product categories are hierarchical with mapping facilities to transaction categories; slugs are unique per team.
- REST upload endpoint cleanly writes into a team-scoped Supabase bucket and returns both `path` and `publicUrl`.

---

## Issues and Root Causes (with references)

1) ProductSheet references `detailsQuery` but does not define it
   - File: `apps/.../product-sheet.tsx`
   - References: `detailsQuery.data` and `detailsQuery.refetch()` at lines ~127, ~365, ~368, ~393 (grep shows multiple locations), but no `trpc.products.details.useQuery` is declared.
   - Impact: Runtime error when opening Variant section; repeated invalidations without an actual query instance; confusion in variant list state.

2) Unconditional `teams.current` fetch on every sheet mount
   - File: `apps/dashboard/src/hooks/use-team-currency.ts` and usage in `product-sheet.tsx:53`.
   - Root cause: `useTeamCurrency()` calls `trpc.teams.current.useQuery()` with default options (no staleTime override). Logs show avg ~714.5ms; called frequently.
   - Impact: Adds ~700ms to sheet-open path even for “New product” flow; contributes to perceived slowness across the app.

3) Heavy sheet bundle due to static imports and top-level dependencies
   - ProductSheet statically imported by `products-view.tsx`, preventing code-splitting; the sheet’s dependencies are always in the Products page bundle.
   - Heavy imports inside sheet:
     - `react-dropzone` at `product-sheet.tsx:22`
     - `@Faworra/supabase/client` at `product-sheet.tsx:23`
     - `cmdk` via ComboboxDropdown
   - Impact: Larger initial JS + more hydration work for the list view, even when the sheet is closed.

4) Media path stores public URLs instead of storage paths (UI)
   - File: `product-sheet.tsx:200` pushes `{ path: json.url, ... }` after upload.
   - REST endpoint returns both `path` (storage path) and `url` (public URL). DB stores only `path`.
   - Impact: Persisting public URLs limits future signed URL/private bucket strategies, and diverges from the intended schema usage.

5) No DB constraint for single primary image per product/variant
   - Schema: `product_media` defines `isPrimary` but no unique partial index enforcing one primary per (team, product[, variant]).
   - API clears other primaries before setting one, but race conditions are possible.
   - Impact: Potential multiple primaries on concurrent updates; inconsistent UI.

6) Media reordering is naive
   - UI updates a single `position` up/down without normalizing others.
   - Query orders by `(is_primary DESC, position NULLS LAST, created_at DESC)`.
   - Impact: Duplicate positions and non-deterministic ordering if items get the same `position`.

7) tRPC `products.details` used frequently and slowly
   - File: `apps/api/src/trpc/routers/products.ts` → two sequential DB queries.
   - Despite existing indexes (`0031_products_perf_indexes.sql`), logs show 700–2100ms.
   - Impact: Edit flow feels sluggish; compounded by repeated invalidation/refetch cycles.

8) Products list lacks virtualization (per guidelines)
   - File: `products-view.tsx` renders full table without virtualization; fine for small lists but will degrade >50 rows.

---

## Recommendations (Prioritized with Effort vs Impact)

### P0 (High impact, low–medium effort)

1) Define and use `detailsQuery` in ProductSheet
   - Add `const detailsQuery = trpc.products.details.useQuery({ id: productId! }, { enabled: !!productId, staleTime: 30_000 });`
   - Use `detailsQuery.data?.variants` for the variants list; drop orphaned references.
   - Effort: S; Impact: Prevent runtime errors; fewer confusing invalidations.

2) Make currency fetch cheap or eliminate it on sheet mount
   - Option A: Update `useTeamCurrency` to `staleTime: Infinity, gcTime: long`; cache globally.
   - Option B: Pass currency from server as a prop/context for the entire dashboard; avoid query entirely on mount paths.
   - Effort: S; Impact: ~700ms saved on many sheet opens.

3) Code-split the ProductSheet
   - In `products-view.tsx`, use `next/dynamic` to import the sheet lazily and render only when open. Example: `const ProductSheet = dynamic(() => import('./product-sheet'), { ssr: false });`
   - Effort: S; Impact: Reduce initial bundle and hydration for the list.

4) Lazy-load heavy sheet dependencies
   - Move `createBrowserClient` import inside `uploadAndAttach` and dynamic-import `react-dropzone` or wrap Dropzone in a dynamically imported component rendered only when Media section opens.
   - Effort: S–M; Impact: Smaller sheet chunk; faster open, less hydration.

5) Persist storage path (not public URL) to DB for media
   - Change `product-sheet.tsx:200` to use `json.path` when calling `mediaAddMany`/`mediaAdd`.
   - Derive public or signed URL at render time (client: `supabase.storage.from(...).getPublicUrl(path)` or server-provided signed URLs).
   - Effort: M (plus a small data migration); Impact: Future-proofing for private media/signed URLs.

6) Add DB constraint for single primary image
   - Add partial unique index, e.g.: `CREATE UNIQUE INDEX uq_product_media_primary ON product_media (team_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000')) WHERE is_primary = true;`
   - Effort: S; Impact: Data correctness under concurrency.

### P1 (Medium impact)

7) Reduce `products.details` roundtrips and invalidations
   - Combine product + variants in one DB query where possible, or keep as-is but add caching (`staleTime`) and avoid redundant prefetches.
   - Debounce prefetch on hover/focus; prefetch only once per ID.
   - Effort: M; Impact: Shaves ~0.5–1.0s from edit flows.

8) Normalize media reordering
   - Add API to reorder with dense ranks in a single transaction. Recompute contiguous positions to avoid duplicates.
   - Effort: M; Impact: Deterministic UI ordering; simpler client.

9) Category list optimization
   - Either pass categories as `initialData` from the server page or set `staleTime: 5–10m` to avoid repeated fetches.
   - Effort: S; Impact: Removes a ~350ms call on many opens.

### P2 (Strategic/longer-term)

10) Products list virtualization (>50 rows)
   - Adopt `@tanstack/react-virtual` per `docs/coding-guidelines-data-tables.md`.
   - Effort: M; Impact: Sustained performance at scale.

11) Real-time updates for products
   - Subscribe to product/variant/media changes; invalidate minimal queries on change.
   - Effort: M; Impact: Fresher UI without manual refetch cycles.

12) Extract shared hooks (invalidations, filters)
   - Centralize invalidation logic; adopt keyboard navigation and filter URL state per guidelines.
   - Effort: M; Impact: Consistency and maintainability.

---

## Integration Readiness (Shopify/Medusa)

Mapping status:
- Products: `products` with `status`, `type`, `slug`, `description`, `attributes` (jsonb) → OK baseline.
- Variants: `product_variants` with `sku`, `barcode`, `price`, `currency`, `status`, `fulfillmentType`, `stockManaged`, `leadTimeDays` → matches most platforms.
- Inventory: `product_inventory` per variant/location → maps to Shopify InventoryLevel / Medusa inventory modules.
- Media: `product_media` with `isPrimary` and `position` → maps to product images.
- Categories: `product_categories` hierarchical with team scope; mappings to transaction categories exist.

Gaps to address:
- Variant options/option values (e.g., Color/Size) not modeled; only free-form `attributes` jsonb. Most platforms require explicit options.
- External IDs and source per entity (product, variant, media) to track remote systems (Shopify/Medusa) and support idempotent sync.
- Sync state (cursors, last synced at, per-entity hash/fingerprint) and retry strategy.
- Pricing regions, taxes, and multi-currency strategies (beyond per-variant currency field) for Medusa-style setups.
- Media path strategy should prefer storage path + derived/signed URLs to handle private assets and CDN changes.

Recommended additions:
- Tables/columns: `external_source` (enum), `external_id`, `external_sync_state`, `external_updated_at` on `products`/`product_variants`/`product_media`.
- Option modeling: `product_options` and `product_option_values` linked to variants; or enforce option schema within variants.
- Webhooks & jobs: endpoints and workers for push/pull sync; conflict resolution policy.

---

## Risks and Migration Considerations

- Changing media storage behavior (URL → path) requires a data migration for existing rows and a UI adjustment to derive URLs. Plan a backfill job and shields to handle mixed data during rollout.
- Adding unique partial index for primary image may fail on existing duplicated primaries; first resolve duplicates and then apply the index.
- Code-splitting and lazy-loading can impact SSR/CSR boundaries; verify Next.js config and ensure no unexpected hydration mismatches.
- Increasing caching (`staleTime`) reduces fresh reads; ensure invalidation flows (after create/update/delete) cover all affected queries.

---

## Next Steps Checklist

- [ ] Add `detailsQuery` to ProductSheet and wire variants correctly; remove dangling references.
- [ ] Update `useTeamCurrency` to avoid repeated network calls (staleTime Infinity) or inject currency from server via context/prop.
- [ ] Code-split ProductSheet via `next/dynamic`; render only when sheet is open.
- [ ] Lazy-load `react-dropzone` and move `createBrowserClient` import inside the upload function.
- [ ] Persist storage `path` (not public URL) to product_media; adjust rendering to derive URLs; plan a migration for existing rows.
- [ ] Create partial unique index for single primary image per scope; add a migration + pre-clean duplicates.
- [ ] Build a reorder API to normalize `position` values transactionally.
- [ ] Reduce redundant `products.details` calls (debounce prefetch, add `staleTime`, avoid invalidating more than needed).
- [ ] Virtualize Products table when rows > 50; follow `docs/coding-guidelines-data-tables.md`.
- [ ] Define integration fields (external IDs, options modeling, sync state) to prepare for Shopify/Medusa.

---

## File/Line References (selected)

- ProductSheet heavy imports and currency fetch:
  - `apps/dashboard/src/app/(dashboard)/products/_components/product-sheet.tsx:22` – `react-dropzone`
  - `apps/dashboard/src/app/(dashboard)/products/_components/product-sheet.tsx:23` – `createBrowserClient`
  - `apps/dashboard/src/app/(dashboard)/products/_components/product-sheet.tsx:53` – `useTeamCurrency()` usage
  - Missing `detailsQuery` (refs at ~127, 365, 368, 393)

- Media storage path vs URL:
  - `apps/dashboard/src/app/(dashboard)/products/_components/product-sheet.tsx:200` – storing `json.url` into `path`
  - REST upload returns `{ path, url }`: `apps/api/src/rest/products.ts`

- Section-gated queries (good):
  - Media list enabled: `apps/.../product-sheet.tsx:133`
  - Inventory editor queries: `apps/.../product-sheet.tsx:543–552`

- Products list and sheet wiring:
  - Server data fetch: `apps/dashboard/src/app/(dashboard)/products/page.tsx`
  - Client view and static sheet import: `apps/dashboard/src/app/(dashboard)/products/_components/products-view.tsx`

- API routers:
  - Products: `apps/api/src/trpc/routers/products.ts`
  - Product categories: `apps/api/src/trpc/routers/product-categories.ts`

- DB schema and indexes:
  - Schema: `packages/database/src/schema.ts`
  - Enriched list query: `packages/database/src/queries/products.ts`
  - Perf indexes: `drizzle/manual-migrations/0031_products_perf_indexes.sql`

---

## Appendix: tRPC Log Context

Raw lines sampled (`logs/api.log`): lines include `[trpc][slow] ... query:products.details ... queries=2` indicating two DB operations inside the resolver. Similar for `teams.current`.
