# Engineering Constitution

Principles
- Server‑first; use initialData on all pages; no client prefetch for initial loads.
- Drizzle schema is the source of truth; regenerate Supabase types after schema changes.
- Strong typing only: no `any`; typed Hono context; one `Database` type.
- Auth middleware yields { userId, teamId, supabaseAdmin }; every DB query filters by `team_id`.
- REST/tRPC: select minimal columns, avoid N+1; `.returns<T>()` only at the chain end.
- Validation with Zod and consistent `{ error: string }` responses; fail fast.
- Performance: proper indexes; avoid `select *`; use keyset pagination for scale.
- Search: use `tsvector` + GIN; avoid broad `ILIKE` on large tables.
- Security: RLS on; server‑only secrets; short‑lived signed storage URLs.
- Observability: structured logging (requestId, userId, teamId); basic DB timing; optional OTEL.
- CI gates: typecheck, lint, test, build; schema/type drift check; block unscoped queries.

PR Checklist
- [ ] All queries filter by `team_id`; auth middleware in use.
- [ ] No `any`; Hono context access is typed.
- [ ] Supabase types regenerated or confirmed unchanged.
- [ ] Minimal selects; `.returns<T>()` only at end of tRPC chains.
- [ ] Zod validation present; error shape `{ error: string }` consistent.
- [ ] CI passes typecheck/lint/test/build; no schema/type drift.
- [ ] UI/UX mirrors Midday patterns; no placeholders without approval; deviations documented.
- [ ] Data tables follow docs/coding-guidelines-data-tables.md (infinite query, virtualization, real‑time, hooks).
- [ ] InitialData pattern used with no mount refetch; infinite queries wired with initialData.
- [ ] Keyset pagination on large tables; composite indexes (e.g., `team_id, created_at DESC`).
- [ ] Search uses `tsvector` + GIN; no broad `ILIKE` scans.
- [ ] Queries use shared team‑scoped helpers or explicit predicate; lint rule for scoping passes.

Notes
- Full background: docs/engineering-constitution.md
- Data Table Guidelines: docs/coding-guidelines-data-tables.md
