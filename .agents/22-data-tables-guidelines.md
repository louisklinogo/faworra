 # Data Table Guidelines (Summary)
 
 This is a concise, action‑oriented summary of the full guide. See full doc → `docs/coding-guidelines/coding-guidelines-data-tables.md`.
 
 Focus: consistent, performant list/table pages (transactions, clients, orders, invoices, etc.).
 
 Key requirements
 - Server fetch → pass initialData → client uses it to avoid mount refetch.
 - useSuspenseInfiniteQuery with getNextPageParam; no prefetch/HydrateClient.
 - Virtualize tables with >50 rows using `@tanstack/react-virtual`.
 - Real‑time via Supabase channels; avoid polling; optional 60s fallback.
 - Cursor/keyset pagination for scale; avoid offset/limit on large tables.
 - Cache tuning: set staleTime/gcTime per data volatility.
 - URL filter state with nuqs; keep transient UI state local (useState).
 - Optimistic mutations with proper rollback; invalidate shared keys on success.
 - Keyboard accessibility: up/down, home/end, space, shift+space, enter.
 - Clear loading/empty/error states; bottom sentinel for infinite scroll.
 
 Structure template
 ```
 feature/
 ├─ page.tsx                 # Server (fetch initialData)
 ├─ _components/
 │  ├─ feature-view.tsx      # Client orchestrator
 │  ├─ feature-columns.tsx   # Column defs
 │  ├─ feature-table.tsx     # Table renderer (opt)
 │  └─ feature-toolbar.tsx   # Actions (opt)
 ├─ _hooks/
 │  ├─ use-feature-data.ts
 │  ├─ use-feature-filters.ts
 │  ├─ use-feature-mutations.ts
 │  └─ use-feature-invalidation.ts
 ```
 
 Performance targets
 - Initial load < 400ms; 1000 rows render < 100ms; smooth 60fps scrolling.
 
 Checks before commit
 - Virtualization on large sets; realtime wiring; no `any`; optimistic updates; extracted hooks; `bun run typecheck` and `bun run lint` pass.
