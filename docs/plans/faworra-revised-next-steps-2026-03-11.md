## 1. Overview

This plan revises the next implementation phase for `faworra-new` using the confirmed repo state and updated constraints.

### Status update (2026-03-11)
- The core auth/team foundation described here is now landed.
- Next 16 uses `apps/dashboard/src/proxy.ts` instead of `middleware.ts` for optimistic route gating.
- The dashboard now relies on centralized `viewer` context for session + active-team resolution.
- The onboarding flow bootstraps `teams`, `team_memberships`, `team_settings` (industry-neutral, no hardcoded industry key), and `user_context` together.
- The tenancy design checkpoint is now documented in `docs/plans/2026-03-11-team-tenancy-architecture.md`.

### Goals / success criteria
- Finalize local hostname + session transport **before** auth/middleware work.
- Add a Midday-style team-scoped request model on top of Better Auth.
- Replace page-local auth checks with centralized dashboard/API enforcement.
- Introduce team tenancy only after a short schema-design checkpoint.
- Keep billing env requirements real in dev; no bypass path.

### Out of scope
- Broad business-domain modules beyond auth/team foundation
- Mobile feature work beyond compatibility with shared auth/session changes
- Production deployment work

## 2. Prerequisites and gating decisions (must be resolved first)

### Fixed inputs
- Dev hosts must use `*.faworra.localhost`.
- Better Auth currently lives in `packages/auth/src/index.ts`.
- API mounts auth at `apps/api/src/index.ts -> /api/auth/*` and tRPC at `/trpc/*`.
- Dashboard currently talks to the API directly via `apps/dashboard/src/lib/auth-client.ts` and `apps/dashboard/src/utils/trpc.ts`.
- Current DB package already includes auth, core, and team schema modules; the current foundation is no longer auth-only.

### Discovery questions / decisions to close before Milestone 1
1. **Canonical host map:** confirm `api.faworra.localhost`, `dashboard.faworra.localhost`, and `docs.faworra.localhost` as the actual Portless/dev entrypoints.
2. **Session transport contract:** decide whether dashboard continues calling the API subdomain directly, with Better Auth cookies scoped for `*.faworra.localhost`, or whether a same-origin dashboard proxy is needed if browser cookie behavior is unreliable.
3. **Cookie policy:** validate the local-dev cookie settings needed for the chosen transport (`domain`, `sameSite`, `secure`) because current auth config hard-codes `sameSite: "none"` and `secure: true`.
4. **Billing env contract:** enumerate the minimum Polar envs required for local boot and document them; do not add a dev-only escape hatch.
5. **Tenancy design checkpoint:** approve the app-level team model and active-team storage before any Drizzle migration is generated.

## 3. Recommended auth/team model (Midday-aligned, adapted for Better Auth)

### Recommendation
- Keep Better Auth tables in `packages/db/src/schema/auth.ts` limited to identity/session/account concerns.
- Add app-level tenancy tables in a new schema module, e.g. `packages/db/src/schema/team.ts`:
  - `teams`
  - `team_memberships` with `role`, status, timestamps
  - `team_settings`
- Add a lightweight app-level user-context table in `packages/db/src/schema/core.ts` (or similar) keyed to Better Auth `user.id` that stores:
  - `userId`
  - `activeMembershipId` as the primary active-workspace pointer
  - `activeTeamId` as a compatibility fallback during the migration window
  - optional onboarding/default-team metadata

### Why this is the right adaptation
- Midday’s core behavior is: membership join table is the source of truth, while the user may also keep a direct current/default team reference for compatibility or convenience.
- Better Auth already owns the auth `user` table here; keeping tenancy outside auth avoids turning auth schema into business schema.
- `activeMembershipId` should be the primary active-workspace invariant, with `activeTeamId` validated and retained only as a compatibility fallback until the migration window closes.

### Default / active team behavior
- On first successful signup, create a default team, owner membership, and user-context row in one transaction.
- API context resolves `session -> user -> activeTeam -> membership` centrally.
- Dashboard middleware/layouts consume that centralized result; pages should stop doing ad hoc team resolution.

## 4. Prioritized workstreams and milestones

### Milestone 0 — Hostname and session contract
**Files:** `scripts/run-dev-with-portless.mjs`, `packages/env/src/server.ts`, `packages/env/src/web.ts`, local env examples/docs.
- Move dev URLs from `localhost` to `*.faworra.localhost`.
- Set final local values for `BETTER_AUTH_URL`, `NEXT_PUBLIC_SERVER_URL`, `CORS_ORIGIN`, and `POLAR_SUCCESS_URL`.
- Decide and document cookie/session transport across dashboard <-> API.
**Validation:**
- Start API + dashboard and confirm both boot on the agreed hosts.
- Verify `/api/auth/session` can set/read session cookies from dashboard requests.
- Verify dashboard-origin tRPC calls include the session successfully.

### Milestone 1 — Tenancy design checkpoint (pre-schema)
**Files:** design note under `docs/plans/` or inline ADR; no migration yet.
- Lock the table set, foreign keys, membership roles, unique constraints, and default-team bootstrap rules.
- Decide when the compatibility fallback can be removed so `user_context.activeMembershipId` becomes the only active-workspace pointer.
- Canonical reference: `docs/plans/2026-03-11-team-tenancy-architecture.md`.
**Validation:**
- Review schema sketch against current auth table keys in `packages/db/src/schema/auth.ts`.
- Confirm every tenant-owned future table will carry `team_id` and resolve team from middleware/context only.
- Do not proceed to migration generation until this checkpoint is approved.

### Milestone 2 — Auth boundary hardening in dashboard + API
**Files:** `packages/auth/src/index.ts`, `apps/api/src/index.ts`, `apps/dashboard/src/lib/auth-client.ts`, `apps/dashboard/src/utils/trpc.ts`, create `apps/dashboard/src/proxy.ts`, adjust `apps/dashboard/src/app/dashboard/page.tsx`.
- Update Better Auth trusted origins/cookie settings for the finalized dev contract.
- Replace page-only protection with dashboard middleware redirects.
- Keep API auth mounted centrally and aligned with the chosen base URL.
**Validation:**
- Unauthenticated request to `/dashboard` redirects to `/login`.
- Authenticated user reaches `/dashboard` without page-level fallback logic doing all the work.
- `privateData` tRPC query succeeds from the dashboard and fails when signed out.

### Milestone 3 — Team schema and bootstrap transaction
**Files:** create `packages/db/src/schema/team.ts`, create `packages/db/src/schema/core.ts` (or equivalent), update `packages/db/src/index.ts`, generate `packages/db/src/migrations/*`.
- Add teams, memberships, settings, and active-team persistence.
- Add signup/bootstrap server logic to create default team + owner membership + active team in one transaction.
**Validation:**
- `bun run db:generate` produces a migration cleanly.
- `bun run db:migrate` applies cleanly on a fresh local database.
- After signup, DB shows one user, one team, one owner membership, one active-team record.

### Milestone 4 — API context and permission middleware
**Files:** `packages/api/src/context.ts`, `packages/api/src/index.ts`, `packages/api/src/routers/index.ts`, likely new helpers under `packages/api/src/lib/*`.
- Expand context from `{ session }` to `{ session, userId, activeTeam, membership }`.
- Split authentication from authorization: session guard first, team-membership resolution second.
- Make protected procedures depend on centralized membership checks, Midday-style.
**Validation:**
- Signed-in user with membership gets `activeTeam` in context.
- Signed-in user without valid membership gets deterministic onboarding/forbidden behavior.
- Cross-team access attempts fail through middleware, not handler-specific checks.

### Milestone 5 — Dashboard team flow and startup QA
**Files:** `apps/dashboard/src/app/login/page.tsx`, auth forms/components, onboarding/team-selection routes as needed, docs/README.
- Route new users into the default-team flow.
- Add team selection only if/when multiple memberships exist; otherwise use the stored active workspace context, with `activeMembershipId` as primary.
- Document the required Polar envs for local development instead of bypassing them.
**Validation:**
- Fresh signup lands in a usable default team.
- Returning user resumes the stored active team.
- Missing billing envs fail fast with a clear startup error; valid envs boot cleanly.
- Run `bun run check-types` and `bun run check` after milestone completion.

## 5. File changes summary

### Likely modified
- `packages/auth/src/index.ts`
- `apps/api/src/index.ts`
- `packages/api/src/context.ts`
- `packages/api/src/index.ts`
- `packages/api/src/routers/index.ts`
- `apps/dashboard/src/lib/auth-client.ts`
- `apps/dashboard/src/utils/trpc.ts`
- `apps/dashboard/src/app/dashboard/page.tsx`
- `scripts/run-dev-with-portless.mjs`
- `packages/env/src/server.ts`, `packages/env/src/web.ts`

### Likely created
- `apps/dashboard/src/proxy.ts`
- `packages/db/src/schema/team.ts`
- `packages/db/src/schema/core.ts` (or equivalent)
- `packages/db/src/migrations/*`
- API permission/team-resolution helpers
- Short tenancy design note/ADR under `docs/plans/`

## 6. Testing strategy
- Add focused tests around context/team-resolution helpers once extracted.
- Add middleware/redirect coverage for dashboard protected routes if the repo already has a Next test setup; otherwise use smoke validation first.
- Per milestone, always run the smallest useful check first, then `bun run check-types` and `bun run check`.
- Manual smoke path: boot API + dashboard, sign up, confirm default team bootstrap, load `/dashboard`, call protected tRPC, sign out, confirm redirect.

## 7. Risks and assumptions

### Assumptions
- `apps/dashboard/src/middleware.ts` does not exist yet.
- DB tenancy tables are not yet implemented; only auth schema is present.
- Direct dashboard -> API calls remain acceptable if cookie behavior on `*.faworra.localhost` is stable.

### Risks
- Cross-subdomain cookie behavior on local wildcard hosts may force a proxy or HTTPS-local adjustment.
- Mixing tenancy into Better Auth tables would increase migration and adapter risk.
- Polar plugin startup requirements may block local auth until env documentation is tightened.
- Mobile cookie forwarding (`apps/mobile/utils/trpc.ts`) must remain compatible with any auth cookie changes.

## 8. Rollback plan
- Keep milestones landable independently.
- If Milestone 2 regresses auth, revert middleware/cookie/base-URL changes without touching schema work.
- If Milestone 3 regresses data model, revert the generated migration and disable bootstrap logic.
- If Milestone 4 regresses authorization, temporarily fall back to session-only protection while preserving schema.

## 9. Estimated effort
- Complexity: **medium-high**
- Rough effort: **3-5 focused days** once Milestone 0 and Milestone 1 decisions are closed.

## 10. Remaining questions needing user confirmation
1. If browser handling of cookies on `*.faworra.localhost` is not reliable enough, do you want the fallback to be **HTTPS local dev** or a **dashboard-side same-origin proxy**?
2. For the first default team, is a personal workspace naming convention acceptable (for example, based on the user name), or do you want a specific product/team naming rule from day one?
