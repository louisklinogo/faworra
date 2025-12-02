# Architecture

Refactor Overview
- Migrated to Next.js 15 Server Components + tRPC. All new code follows this architecture.

Workspace Structure
```
apps/
├─ dashboard/   # Next.js 15 (Server + Client Components)
├─ api/         # Hono backend with tRPC
└─ worker/      # WhatsApp (Baileys)

packages/
├─ supabase/    # Auth, simple queries, RLS, realtime
├─ database/    # Drizzle schema, pooling, complex queries
└─ ui/          # Shared React components (shadcn)
```

Data Flow Pattern (critical)
```
[Server Component] → direct DB query → pass initialData → [Client Component]
```
- Server Component: initial fetch, direct DB access, no hooks.
- Client Component: interactivity, forms/mutations, hooks/state.
- tRPC Query: client data fetching, cache, realtime.
- tRPC Mutation: create/update/delete with optimistic updates.
- Supabase: auth, simple CRUD (RLS), realtime.
- Drizzle: complex queries, joins, transactions, bulk ops.

Package Responsibilities
- packages/supabase: browser/server clients, auth, realtime, RLS.
- packages/database: schema source, query builders, type‑safe ops.
- apps/api: tRPC routers, auth middleware, REST webhooks, business logic.
- apps/dashboard: App Router, Server data, Client UI, tRPC hooks, Supabase auth.

Reference Codebases
- `midday` for Server Components, tRPC setup, package structure.
- `evolution-api` for WhatsApp integration and media.
