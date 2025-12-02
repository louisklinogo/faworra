 # Products-New Page — Production Blueprint
 
 ## Goals & KPIs
 - p95 API list/search < 120ms @ 50k rows/team; initial TTI < 400ms; infinite append < 120ms; smooth 60fps on >2k rows.
 - Zero image URL errors; no mount refetch when initialData present; stable keyset pagination.
 
 ## Data Model & Indexes
 - products: composite keyset index (team_id, updated_at DESC, id DESC).
 - product_media: primary image index (team_id, product_id, is_primary DESC, position NULLS LAST, created_at DESC).
 - Keep products.search_tsv + GIN for FTS.
 - Optional scale-up: product_aggregates table/materialized view with variants_count, price_min/max, stock_on_hand/allocated, primary_image_path.
 
 ## Query Design (Server-first, minimal selects)
 - Server fetch initial 50 items (teamId + filters + keyset). Pass initialData to client.
 - Prefer correlated subqueries over wide joins to compute: variants_count, price_min/max, stock_on_hand/allocated, primary_image_path (all backed by indexes).
 - Minimal product fields in list: id, name, status, updated_at.
 - Cursor: { updatedAt, id } with DESC ordering; WHERE supports keyset.
 
 ## tRPC & Caching
 - products.list accepts { search?, status?, categorySlug?, sort?, limit, cursor }.
 - useSuspenseInfiniteQuery with full filter key; staleTime 30s; disable refetch on mount/focus/reconnect when initialData present.
 - Single invalidate hook for list/details post-mutation.
 
 ## UI/UX Structure
 - page.tsx (Server): resolve teamId; fetch initial list; pass initialData + current filters.
 - products-new-view.tsx (Client):
   - Filters via nuqs: q, statuses[], category; map to API.
   - useSuspenseInfiniteQuery with initialData shape; infinite scroll via inView.
   - Virtualization via @tanstack/react-virtual when rows > 50.
   - Columns: image (SupabaseImage), name, variants, price range, stock, status; defer heavy UI via dynamic().
   - Safe images via SupabaseImage; never pass raw storage path to next/image.
 - Sorting: Updated (DESC) default; optional by Name/Price.
 
 ## Observability
 - API sets X-Response-Time; measure p50/p95 across 30 runs per scenario (empty, 1-term, 2-term).
 - DB: EXPLAIN ANALYZE shows GIN + keyset index used; no hot-path seq scans.
 - Frontend: profile scroll FPS and infinite append path.
 
 ## Rollout Steps
 1) Add indexes (migration files only; run with approval).
 2) Implement products-new page with server-first + initialData + virtualization + safe images.
 3) Wire search/status/category to tRPC; measure. If p95 still > 120ms, ship correlated subquery version; only then consider aggregates table.
 
 ## Acceptance Criteria
 - Backend p95 < 120ms, EXPLAIN uses correct indexes.
 - Frontend TTI < 400ms, infinite append < 120ms, 60fps scroll.
 - No image URL errors, no unnecessary refetches, strict TS.
