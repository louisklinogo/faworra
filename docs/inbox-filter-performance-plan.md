# Inbox Filter Performance Alignment Plan

## Objectives
- Match or exceed Chatwoot’s perceived responsiveness when switching inbox filters.
- Minimise duplicated network/database work per filter change.
- Preserve existing feature set (ownership counts, infinite scroll, TRPC architecture).

## Current Pain Points
- **Multiple TRPC calls per toggle**: `threadsByStatus` + `ownershipCounts` fire in parallel.
- **Chained DB queries**: tags, latest message, and unread counts are fetched via three extra queries.
- **URL sync overhead**: `router.replace` runs on every change, adding a render pass.
- **React Query cache churn**: infinite query invalidation clears the list before new data lands.
- **Virtualizer re-measure**: list resets and re-computes heights, accentuating the transition delay.

## Chatwoot Insights
- Single REST call returns list rows + meta (counts, unread) together.
- Vuex stores the list and filters client-side; network only runs for the new page.
- UI keeps previous rows visible while a lightweight spinner overlays.

## Proposed Milestones

### 1. Consolidated Data Endpoint
- Extend `getThreadsByStatus` (or create a SQL view) to return:
  - Thread rows with latest message content/direction.
  - Unread inbound count per thread.
  - Tag IDs and metadata (pre-joined aggregate JSON).
  - Ownership aggregates (`mine`, `unassigned`, `all`).
- Update the TRPC procedure to call this new query only once and drop the follow-up calls.
- Ensure serializer emits the combined payload to React Query in one response.

### 2. Ownership Count Handling
- Remove separate `ownershipCounts` query; consume the consolidated counts from the primary response.
- Adjust client state so the counters update from `lastPage.meta` instead of a second hook.

### 3. Client-State Optimisations
- Wrap URL sync in `startTransition` and debounce by ~200 ms to avoid rapid navigation churn.
- Keep prior page data visible during refetch via React Query’s `placeholderData`/`keepPreviousData`.
- Introduce a light overlay loader rather than clearing list items.

### 4. Virtualizer Stability
- Seed `estimateSize` using last-known measurements per thread ID.
- Cache `ResizeObserver` results so filter toggles reuse row heights when rows repeat.

### 5. Telemetry & Guardrails
- Instrument timing via browser Performance API + server logging to verify improvement.
- Add regression tests (Playwright snapshot or Vitest) to confirm counts and items stay correct after refactor.

## Deliverables
- Updated database query or SQL view + TRPC router.
- React Query hook adjustments using single payload.
- UI refinements for smoother transitions.
- Benchmarked before/after stats documented in PR description.

## Implementation Order
1. Build consolidated SQL/ORM query and update serializer.
2. Simplify TRPC router to return `{ items, meta }` (meta includes ownership counts + next cursor).
3. Refactor dashboard hooks to rely on the single response (remove extra query, adjust state).
4. Optimise UI rendering (transition, placeholders, estimate cache).
5. Measure and iterate.
