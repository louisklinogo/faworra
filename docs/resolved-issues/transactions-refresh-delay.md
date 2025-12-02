# Transactions table refresh delay (~5s)

Problem
- Adding a transaction from the create sheet took ~5 seconds to appear in the table.

Root cause
- The table used a custom TanStack Query key (`["transactions.enrichedList", enrichedInput]`) while the create mutation invalidated tRPC keys (`utils.transactions.enrichedList.invalidate()`).
- Because keys didn’t match, the list didn’t refetch immediately; it only updated when the Supabase realtime “enrichment completed” event fired a few seconds later (plus a 15s staleTime).

Fix
- Standardized the table to use tRPC’s query key factory: `utils.transactions.enrichedList.infiniteQueryOptions(enrichedInput)` with `useSuspenseInfiniteQuery` and preserved `initialData`.
- Updated optimistic cache patches (menu/bulk actions) to use `utils.transactions.enrichedList.getQueryKey(enrichedInput, "infinite")` instead of ad‑hoc keys.

Impact
- `utils.transactions.enrichedList.invalidate()` now refetches the active list immediately after create, eliminating the visible delay.

Apply this pattern to other pages
- Use tRPC `queryOptions`/`infiniteQueryOptions` everywhere and avoid manual query keys.
- When doing optimistic updates, derive keys via `getQueryKey(...)`.

## Orders page

Problems observed
- Filters were not wired to URL/server; server page ignored URL and fetched unfiltered data.
- Duplicate filter state in the client (local `searchQuery/statusFilter` vs URL state) led to inconsistencies.
- Client-side list filtering fought with server-side pagination; heavy `utils.invalidate()` on mutations.

Fixes implemented
- Server/API/DB: `orders.page.tsx` now reads `status` and `q` from `searchParams` and passes them to tRPC; `orders.list` input extended with `status`/`search`; DB query applies `status` equality and `ilike` search on order number and client name.
- Client: Infinite query now includes `{ status, search }` from URL; removed local filter state; inputs write to URL via `setFilters`; set `filteredOrders = orders` (server-side filtering only).
- Perf: Added virtualization with `@tanstack/react-virtual` and IntersectionObserver sentinel for automatic load-more.
- Cache: Replaced broad `utils.invalidate()` with targeted invalidations: `orders.list`, `invoices.list`, and analytics cards (`highestValueOrder`, `completedOrdersThisMonth`, `pendingOrdersCount`, `averageOrderValue`).

Result
- Filters are reflected in the URL and respected by initialData and pagination; UI is faster with virtualization; cache updates are precise.
