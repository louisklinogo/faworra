# Development Patterns

Performance‑Optimized Pattern
- Use initialData for first render on all pages; no client prefetch for initial loads.
- Apply keyset (cursor) pagination for large lists; avoid offset/limit.
- Virtualize 50+ row lists; wire infinite queries with provided initialData.

Server Components
- Async function, direct DB access via `@Faworra/database/queries`.
- No hooks, no `use client`. Pass data as props.

Client Components
- Mark with `use client`. Use tRPC hooks for queries/mutations.
- Accept initialData and pass it to query options to prevent mount refetch.
- Handle loading/error states and real‑time updates when needed.

Human‑Readable Control Flow
1) Ask: “Can I reuse what I have?” → early return for happy path.
2) Assess: “What’s my state and what must happen?” → clear, exclusive branches.
3) Act: “Get what I need.” → consolidate logic at the end.
- Prefer natural variable names: `canReuseCurrentSession`, `isSameSettings`, `hasNoSession`.
- Avoid nested conditionals that don’t match human reasoning.

tRPC Queries & Mutations
- Queries: minimal selects, `returns<T>()` only at the chain end, no N+1.
- Mutations: optimistic updates where helpful; invalidate relevant queries on success.
