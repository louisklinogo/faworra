## Faworra Phase 1 Foundation

### Purpose

Phase 1 focuses on turning the current `faworra-new` scaffold into a Midday-aligned foundation without trying to implement the full business OS yet.

### Phase type

This is a **code-changing foundation phase**, not a docs-only phase. The intended outcome is a renamed, better-structured scaffold with the first real auth, middleware, context, tenancy, and local-dev foundations in place.

### Phase 1 goals

- Normalize the scaffold around Midday's app and package roles.
- Keep **Better Auth** as the auth provider while copying Midday's middleware and request-context patterns.
- Keep **Supabase Postgres + Drizzle** as the data layer.
- Introduce the **team model** from day one.
- Separate auth schema from core/team schema and later business schemas.
- Standardize local development around **Portless** with role-based names.

### Phase 1 deliverables

- Rename the existing app folders to their role-based names.
- Update scripts, imports, docs, env assumptions, and local URLs to match the renamed apps.
- Implement the first Midday-style auth and middleware foundation using Better Auth.
- Implement the first team-aware request context for API and tRPC.
- Add the initial team/core schema alongside the existing auth schema.
- Prepare the repo for Portless-based local development.

### Current status snapshot

#### Completed so far

- Renamed the scaffold apps to `apps/dashboard`, `apps/api`, and `apps/mobile`.
- Renamed the docs app from `apps/fumadocs` to `apps/docs`.
- Updated scripts, package names, imports, path references, and docs to match the renamed apps.
- Wired Portless-oriented dev scripts into dashboard, API, and docs.
- Added Windows fallback behavior for dev scripts while keeping real Portless support for Linux/macOS.
- Verified the repo in WSL/Linux with `bun run check-types` and `bun run check` passing.
- Verified real Portless routing in WSL/Linux for dashboard and docs.
- Updated Midday reference guidance so the active repo can use `midday/` for code reference and `.references/midday-wiki/` for local documentation lookup.

#### Still open in Phase 1

- Implement dashboard auth middleware using Midday's route-gating pattern.
- Implement API/tRPC session resolution and typed request context.
- Add the first team/core schema (`teams`, `team_members`, `team_settings`).
- Resolve active `teamId` handling in request context and onboarding flows.
- Decide whether local Portless hostnames should stay `*.localhost` or be pushed to `*.faworra.localhost`.
- Make API local dev boot cleanly without a billing-token workaround.

### App mapping

- `apps/dashboard` -> main authenticated product app
- `apps/api` -> Hono + tRPC API app
- `apps/mobile` -> mobile app scaffold
- `apps/docs` -> keep for now as the docs surface

### Current scaffold -> target boundary mapping

| Current scaffold piece | Phase 1 role | Decision in Phase 1 |
|---|---|---|
| `apps/dashboard` | `apps/dashboard` | Renamed in Phase 1 |
| `apps/api` | `apps/api` | Renamed in Phase 1 |
| `apps/mobile` | `apps/mobile` | Renamed in Phase 1 |
| `apps/docs` | docs surface | Keep as-is |
| `packages/api` | current Hono + tRPC boundary | Keep and strengthen |
| `packages/auth` | Better Auth boundary | Keep and strengthen |
| `packages/db` | schema/query boundary | Keep and expand |
| `packages/env` | env boundary | Keep |
| `packages/ui` | shared UI boundary | Keep |

Midday-inspired packages like `packages/trpc`, `packages/supabase`, `packages/job-client`, and `packages/jobs` remain target boundaries, but they are **not introduced in Phase 1 unless needed to support the auth/context/tenant foundation directly**.

### Auth and middleware direction

- Use Better Auth for sessions, cookies, provider accounts, and client auth flows.
- Keep Midday's dashboard middleware pattern: explicit public-route allowlist, redirect unauthenticated users to login, preserve `return_to`, and reserve room for onboarding/team checks.
- Keep Midday's API/tRPC context pattern: resolve session and `teamId` early, then hand a typed context to procedures and middleware.
- Add `teamProcedure` after `protectedProcedure`; permission-aware procedures can follow later.

### Team model behavior in Phase 1

- A user can belong to one or more teams.
- `teams`, `team_members`, and `team_settings` are part of the first non-auth schema set.
- The request context must resolve an active `teamId` for authenticated requests.
- If a user has exactly one membership, that team can be selected automatically.
- If a user has no team yet, the app should route them into onboarding/team creation instead of pretending the team context exists.
- Multi-team switching UX can stay simple in Phase 1, but the data model and context contract must support it.

### Data platform direction

- Supabase remains the platform for Postgres, storage, realtime, and RLS.
- Drizzle remains the schema and query layer.
- The first non-auth tables should be `teams`, `team_members`, and team settings / active-team state.
- Every tenant-owned table added after that carries `team_id`.

### Schema separation

- `schema/auth.ts` for Better Auth tables and auth-only support tables.
- `schema/core.ts` or `schema/team.ts` for teams, memberships, and team settings.
- Later business schemas: CRM, communications, operations, catalog, finance, documents.

### Portless implementation checklist

- Replace numeric localhost assumptions in docs and env usage with role-based names. **Done for the main repo docs and env defaults.**
- Update Better Auth trusted origins and callback assumptions to use Portless hostnames. **Partially done; full auth/middleware work is still pending.**
- Update API origin and CORS assumptions to use Portless hostnames. **Partially done; API local-dev polish is still open.**
- Keep one documented set of local names. **Current docs target `dashboard.faworra.localhost`, `api.faworra.localhost`, and `docs.faworra.localhost`, but the verified WSL Portless runtime is currently using `dashboard.localhost`, `api.localhost`, and `docs.localhost`. This needs a final decision.**
- Ensure renamed app scripts and local URLs still work after the app-folder rename. **Done.**

### Portless local development

- Use role-based names instead of fixed localhost ports.
- Target names:
  - `dashboard.faworra.localhost`
  - `api.faworra.localhost`
  - `docs.faworra.localhost`
- Trusted origins, API URLs, and local callback URLs should follow those names.
- Current reality: in WSL/Linux, the Portless smoke test is working with `dashboard.localhost`, `api.localhost`, and `docs.localhost`. Final hostname branding remains an open follow-up.

### Out of scope for Phase 1

- Worker implementation
- BullMQ / Trigger.dev execution setup
- Most business-domain packages
- Marketing website implementation
- Full AI operator implementation

### Phase 1 acceptance criteria

- The app folders now use role-based names: `apps/dashboard`, `apps/api`, `apps/mobile`, and `apps/docs`. **Done.**
- The repo still runs after the rename, and scripts/imports/docs are updated consistently. **Done in WSL/Linux validation.**
- Dashboard middleware enforces authentication, preserves `return_to`, and allows explicit public/share routes.
- API and tRPC context resolve both session and active `teamId` for authenticated requests.
- The initial team/core schema exists alongside auth schema and migrates cleanly.
- Portless hostnames are the documented local-dev standard and the env/origin assumptions are aligned to them. **Partially done; real Linux verification exists, but the final hostname shape still needs to be settled.**

### Validation scenarios

1. **Dashboard auth gate**
   - Unauthenticated visit to a protected dashboard route redirects to login.
   - The redirect preserves the intended return target.
2. **Authenticated team context**
   - An authenticated request resolves both session and `teamId` in API/tRPC context.
   - A user with no team is sent into onboarding or team creation.
3. **Schema foundation**
   - Auth schema and team/core schema generate and migrate without breaking the scaffold.
4. **Renamed app health**
   - The renamed dashboard, api, mobile, and docs apps are still discoverable and runnable from the monorepo.
5. **Portless readiness**
   - Local URL assumptions, trusted origins, redirects, and CORS planning all reference the role-based Portless names instead of numeric ports.

### Latest verification notes

- Windows verification established that the repo stays usable with localhost fallback when Portless is unavailable.
- WSL/Linux verification established that `bun run check-types` and `bun run check` pass in the active repo.
- WSL/Linux verification also established that Portless is working for dashboard and docs, while API local dev still needs env cleanup for a clean boot path.
