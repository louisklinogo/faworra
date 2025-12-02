# Feature Workflow

Steps
1. Database query: add in `packages/database/src/queries/<feature>.ts`.
2. tRPC router: `apps/api/src/trpc/routers/<feature>.ts`.
3. Register in app router: `apps/api/src/trpc/routers/_app.ts`.
4. Server Component page: `apps/dashboard/src/app/(dashboard)/<feature>/page.tsx` (per initialData pattern).
5. Client Components: `apps/dashboard/src/app/(dashboard)/<feature>/_components/`.

Rules
- Use server‑first data fetching and pass initialData to client.
- Keep types strict; no `any`. Validate inputs with Zod.
- Ensure every query is scoped by `team_id`.
- Add indexes and use keyset pagination for large tables.
- Mirror Midday UI and list actions/links/buttons explicitly in the plan.
