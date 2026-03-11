## 1. Overview

This plan covers the immediate next implementation phase for `faworra-new` based only on the supplied README/package-structure/architecture context.

### Goals and success criteria
- Land authenticated dashboard access using Better Auth with Midday-style protected-route middleware.
- Establish API/tRPC auth and team-aware request context so server code can reliably identify user + active team.
- Introduce the first multi-tenant schema (`teams`, `team_members`, `team_settings`) in Postgres via Drizzle.
- Remove local-dev blockers around Portless hostnames and API billing env requirements.
- Re-run targeted validation so Phase 1 has a stable baseline.

### Scope boundaries
Included now:
- Dashboard auth plumbing
- API auth/context plumbing
- Core team schema + initial server-side wiring
- Local-dev ergonomics fixes needed to unblock auth/API work

Explicitly excluded for this phase:
- Mobile feature work beyond keeping scaffolding compatible
- Marketing/docs expansion beyond minimal updates required by implementation
- Worker/background-job systems
- Broad business-domain modules beyond core tenancy/auth foundations

### Assumptions
- `apps/dashboard`, `apps/api`, `apps/mobile`, and shared packages already exist as stated.
- Better Auth is already chosen, but integration may be partial/incomplete.
- Drizzle + Supabase Postgres are already wired enough to add schema and migrations.
- Portless local URLs are partly configured but not fully finalized.
- No deep code inspection has been performed yet; file paths below are likely targets, not confirmed edits.

## 2. Prerequisites
- Confirm current auth package location and how sessions are meant to be shared between dashboard and API.
- Confirm whether Drizzle schema lives in a shared package (for example `packages/db`) or inside `apps/api`.
- Confirm the canonical env loading pattern across apps (`.env`, `.env.local`, shared env package, etc.).
- Decide whether final Portless hostname choice must happen before middleware cookie/session work.
- Ensure local Supabase/Postgres workflow and migration command are documented before schema work begins.

## 3. Prioritized implementation workstreams

### Workstream 1: Dashboard auth + protected-route middleware
- **Goal:** Make `apps/dashboard` consistently identify authenticated users and protect app routes using Midday-style middleware/request gating.
- **Why now:** Everything else depends on reliable session handling in the main product surface.
- **Dependencies:** Better Auth config location, session cookie/domain strategy, final or temporary local hostname choice.
- **Likely files/areas to inspect or change:** `apps/dashboard` middleware, route groups/layouts, auth helpers, server actions/loaders, env config, shared auth package if present.
- **Validation:** Sign-in/sign-out flow works locally; protected routes redirect correctly; public routes stay accessible; session persists across expected subdomains/origins.
- **Risks:** Cookie domain/origin mismatch with Portless setup; duplicate auth logic between middleware and server loaders; accidental divergence from Midday-style request-context pattern.

### Workstream 2: API/tRPC auth and request context
- **Goal:** Ensure `apps/api` attaches authenticated user identity and active team context to Hono/tRPC requests.
- **Why now:** Server-side authorization and multi-tenancy should be in place before building team-scoped features.
- **Dependencies:** Workstream 1 session model, Better Auth server utilities, initial team-selection rules.
- **Likely files/areas to inspect or change:** `apps/api` Hono entry, tRPC context creation, auth middleware, protected procedures, shared server/auth utilities, request-context helpers.
- **Validation:** Unauthenticated requests are rejected where expected; authenticated requests resolve current user; request context exposes team safely; protected tRPC procedures behave correctly.
- **Risks:** Context duplication between Hono and tRPC; unclear source of active team; weak boundary between authentication and authorization.

### Workstream 3: Core multi-tenant schema (`teams`, `team_members`, `team_settings`)
- **Goal:** Add the minimal database structures required for team-scoped access and settings.
- **Why now:** Request context needs a real persistence model for active team membership and authorization checks.
- **Dependencies:** Confirm Drizzle schema layout, user table identity shape from Better Auth, migration workflow.
- **Likely files/areas to inspect or change:** shared DB schema package or `apps/api` DB module, migration files, seed/dev bootstrap logic, shared types used by API context.
- **Implementation details to settle during inspection:** membership roles, invite vs active states, unique constraints, default team creation strategy, one-to-many relation between team and settings.
- **Validation:** Migration applies cleanly; relations and constraints work; sample user can belong to a team; API context can query team membership without ad hoc SQL.
- **Risks:** Misalignment with existing auth/user table; premature over-modeling of teams; missing indexes/constraints that will complicate authorization later.

### Workstream 4: Team-aware authorization wiring
- **Goal:** Use the new schema in API/dashboard flows so protected routes and procedures operate within a valid team membership.
- **Why now:** This is the bridge between raw schema/context work and actual multi-tenant behavior.
- **Dependencies:** Workstreams 2 and 3.
- **Likely files/areas to inspect or change:** tRPC protected procedures, server-side loaders/actions in dashboard, shared authorization helpers, onboarding/default-team bootstrap flow.
- **Validation:** User without a team gets deterministic onboarding/empty-state behavior; user with multiple teams has a defined active-team selection path; access checks prevent cross-team reads.
- **Risks:** Active-team UX undefined; accidental scattering of membership checks across handlers instead of central helpers.

### Workstream 5: Local-dev ergonomics cleanup
- **Goal:** Remove environment and hostname friction that blocks day-to-day development, especially around API startup and auth callbacks.
- **Why now:** Auth and middleware work will be slow and error-prone until local development is deterministic.
- **Dependencies:** Enough auth/API inspection to know which env vars are actually required.
- **Likely files/areas to inspect or change:** README/setup docs, env schema loaders, local config files, API startup guards around billing-related env vars, Portless hostname docs/config.
- **Validation:** Fresh local boot works without irrelevant billing configuration; documented local URLs match auth callback/session behavior; `bun run check-types` and `bun run check` still pass.
- **Risks:** Relaxing env validation too far in development; choosing a temporary hostname pattern that later breaks cookies or callbacks.

## 4. Recommended execution order with milestones

1. **Milestone A - Discovery and boundary confirmation**
   - Inspect auth package/config placement, dashboard middleware shape, API context entrypoints, DB schema location, env validation pattern.
   - Output: short implementation notes resolving assumptions and confirming actual file targets.

2. **Milestone B - Dashboard auth baseline**
   - Finish Better Auth integration and protected-route middleware in `apps/dashboard`.
   - Output: local login/logout + route protection working on agreed dev hostname.

3. **Milestone C - API authenticated context**
   - Wire Better Auth session/user resolution into Hono/tRPC context.
   - Output: authenticated API procedures can access current user consistently.

4. **Milestone D - Team schema and migrations**
   - Add `teams`, `team_members`, `team_settings` schema and migration.
   - Output: DB supports team membership and settings with basic constraints.

5. **Milestone E - Team-aware authorization**
   - Connect API/dashboard flows to active-team membership checks and bootstrap behavior.
   - Output: protected app/API paths are both user-authenticated and team-aware.

6. **Milestone F - Local-dev hardening and validation**
   - Clean up billing env requirements and finalize/document Portless local behavior.
   - Output: documented local setup plus passing targeted checks (`bun run check-types`, `bun run check`, and relevant auth/API tests if present).

## 5. File changes summary

### Files likely to be modified
- `apps/dashboard/...` middleware, auth helpers, protected layouts/routes, env handling
- `apps/api/...` Hono server entry, tRPC context, auth middleware, protected procedures
- Shared auth package/files if auth logic is centralized
- Shared DB schema/migration area (likely package-level, exact path unconfirmed)
- README/setup/local-development docs
- Env schema/config files for dashboard/API/shared packages

### Files likely to be created
- Drizzle migration(s) for `teams`, `team_members`, `team_settings`
- Possibly new shared request-context/authorization helper modules
- Possibly onboarding/bootstrap helpers for default team creation/selection

### Files likely to be deleted
- None expected from current context

## 6. Testing strategy

### Unit/integration tests to add or update
- Middleware/auth tests for protected vs public dashboard routes
- API/tRPC context tests for authenticated vs unauthenticated requests
- Authorization tests for valid/invalid team membership
- DB schema tests or integration checks for team membership constraints if current repo patterns support them

### Validation commands
- `bun run check-types`
- `bun run check`
- Smallest relevant app/API test targets once actual test runners are confirmed
- Local smoke tests for login, protected routes, and a protected API call

### Manual testing steps
- Start local dashboard + API using documented Portless URLs
- Sign in, navigate to a protected route, confirm redirect behavior
- Call a protected API/tRPC endpoint before and after sign-in
- Verify expected behavior for user with no team and user with one team

## 7. Clarifying questions
- Where does Better Auth currently live, and is there already a shared server/client auth package?
- What is the current canonical user table/schema that `team_members.user_id` should reference?
- How should active team be chosen initially: first membership, explicit selector, or onboarding-created default team?
- Should a new user automatically get a personal/default team during onboarding?
- What billing env requirements are currently blocking local API startup, and are they safe to bypass only in development?
- Is the final Portless hostname decision required now, or can implementation proceed with a clearly temporary dev hostname convention?

## 8. Rollback plan
- Revert dashboard/API auth wiring commits independently if middleware/context changes destabilize local development.
- Roll back team-schema migration using the standard Drizzle migration rollback/down strategy or a compensating migration if down-migrations are not used.
- Guard new team-aware authorization behind minimal helpers so partial rollback does not require sweeping route changes.
- Keep local-dev env relaxations scoped to development mode to minimize production rollback risk.

## 9. Estimated effort
- **Complexity:** Medium-high
- **Rough estimate:** 4-7 focused implementation days after initial discovery
  - Discovery/inspection: 0.5-1 day
  - Dashboard auth + middleware: 1-2 days
  - API/tRPC context: 0.5-1.5 days
  - Team schema + migration: 0.5-1 day
  - Team-aware authorization + local-dev cleanup + validation: 1-2 days

## Immediate recommendation
Start with a short discovery pass to confirm actual auth, API context, DB schema, and env file locations; then execute Milestones B through F in order. Do not begin broader business features until authenticated, team-aware request context is stable.
