# Architecture

How the current Faworra foundation is intended to work for this mission.

**What belongs here:** high-level component boundaries, request/data flow, tenancy invariants, and the Midday-aligned architecture shape workers should preserve.
**What does not belong here:** step-by-step implementation tasks, exact validator commands, or low-level file diffs.

---

## Mission scope

This mission is a **Midday-parity recovery** for the current Faworra foundation, not a full product build.

The work is intentionally concentrated in:

- `apps/dashboard`
- `apps/api`
- `packages/auth`
- `packages/api`
- `packages/db`
- `packages/env`

`apps/mobile` and `apps/docs` are compatibility surfaces only during this mission.

## Current baseline vs target state

### Current baseline

Workers should start from the real current seams, not assume the target state already exists.

Current browser/API seams in scope:

- dashboard browser routes: `/login`, `/onboarding`, `/dashboard`, `/success`
- dashboard route gate: `apps/dashboard/src/proxy.ts`
- page-local viewer checks: `apps/dashboard/src/app/login/page.tsx`, `apps/dashboard/src/app/onboarding/page.tsx`, `apps/dashboard/src/app/dashboard/page.tsx`
- current tRPC/browser bootstrap reads: `viewer`, `privateData`, `onboarding.complete`, `teamInvites.*`

Current missing target primitives:

- `user.me`
- `team.current`
- `team.list`
- `user.switchTeam`
- browser team switcher
- browser invite-recovery surface
- centralized Midday-style protected shell

### Target state for this mission

This mission should move the current baseline toward a Midday-shaped target where:

- protected bootstrap is centralized
- current-team primitives are first-class
- invite recovery is a real browser flow
- multi-membership switching is usable
- out-of-scope billing cannot block auth/dashboard runtime

## Midday-first architecture rule

Workers should treat Midday as the default reference for:

- app and package boundaries
- protected-shell structure
- request-context shape
- tRPC procedure discipline
- team/workspace primitives
- tenancy UX patterns

Workers should diverge only where Faworra has an explicit approved difference:

- **Better Auth** instead of Supabase Auth
- **modular schema modules** instead of one monolithic schema file
- Faworra’s current product scope and naming where the domain differs

### Next.js 16 proxy.ts convention (Faworra divergence)

Next.js 16.x renamed `middleware.ts` to `proxy.ts` as the file convention for
routing middleware. Having BOTH files causes a conflict. Faworra's dashboard uses
`src/proxy.ts` as the sole middleware file. Do NOT create `src/middleware.ts`.

The Midday reference still uses `middleware.ts` (Next.js 15 convention).
When adapting Midday middleware patterns, use `proxy.ts` instead.

### Concrete Midday reference points for this mission

Workers should use these Midday files/patterns as the primary shape reference:

- protected middleware: `midday/apps/dashboard/src/middleware.ts` (adapt to `proxy.ts` in Faworra)
- protected app shell bootstrap: `midday/apps/dashboard/src/app/[locale]/(app)/(sidebar)/layout.tsx`
- request-context headers: `midday/apps/dashboard/src/trpc/request-context.ts`
- user/team primitives: `midday/apps/api/src/trpc/routers/user.ts`, `midday/apps/api/src/trpc/routers/team.ts`
- tenancy UX: `midday/apps/dashboard/src/components/team-dropdown.tsx`
- invite/team recovery surface: `midday/apps/dashboard/src/app/[locale]/(app)/teams/page.tsx`

## Runtime surfaces

### Dashboard app

`apps/dashboard` is the authenticated product surface.

For this mission, it owns:

- public entry and login
- onboarding / workspace recovery
- protected app shell
- dashboard tenancy UX such as workspace switching and invite recovery

The dashboard must feel structurally like Midday’s app shell, even though the auth provider is different.

### API app

`apps/api` is the Hono runtime.

It owns:

- Better Auth HTTP handlers under `/api/auth/*`
- tRPC procedures under `/trpc/*`
- basic health surface
- auth/session-aware server context for the dashboard

### Shared packages

#### `packages/auth`

Owns Better Auth configuration and cross-surface auth behavior. It must remain the single source of truth for session handling and cookie policy.

#### `packages/api`

Owns tRPC router definitions, context creation, and tenancy-oriented server helpers. It should move toward a Midday-shaped contract where session and active workspace are resolved centrally and reused consistently.

Current baseline in this package is still smaller than the target state. Today it exposes `viewer`, `privateData`, `onboarding.complete`, and `teamInvites.*`; this mission is expected to add the missing first-class team primitives.

#### `packages/db`

Owns Drizzle schema/modules and DB access. Auth identity tables stay separate from app-level tenancy tables.

#### `packages/env`

Owns environment validation for server, web, and native surfaces. Out-of-scope services such as Polar must not block boot during this mission.

## Auth and tenancy model

### Identity vs tenancy

Better Auth identity is separate from app tenancy.

- auth/session tables identify the user
- app-level team tables determine workspace access

Workers must preserve that separation.

### Current tenancy tables

The core app-level tenancy model is:

- `teams`
- `team_memberships`
- `team_invites`
- `team_settings`
- `user_context`

### Core invariants

The following invariants are mission-critical:

1. `team_memberships` represent **accepted membership only**
2. `team_invites` are the separate email-based pending-access mechanism
3. `user_context.activeMembershipId` is the intended source of truth for active workspace state
4. `user_context.activeTeamId` remains a temporary compatibility fallback only
5. Onboarding creates a default workspace **only** when the user has zero accepted memberships
6. Invite acceptance activates the accepted membership instead of creating a meaningless default workspace

### Viewer / active workspace resolution

Current resolved-workspace precedence is:

1. `activeMembershipId`
2. fallback `activeTeamId`
3. fallback first accepted membership
4. otherwise `needsOnboarding = true`

This precedence is part of the architecture, not an incidental implementation detail.

### Recovery-state note

Current `needsOnboarding` behavior only means **“no accepted membership was resolved”**. It does **not** yet encode the final browser recovery destination by itself.

During this mission, workers may need to expand the recovery model so the dashboard can distinguish:

- no accepted memberships and no pending invites
- no accepted memberships but pending invite recovery is available
- accepted memberships exist and a usable active workspace can be resolved

## High-level request flow

### Guest -> login

1. A guest requests a protected dashboard route.
2. Dashboard route protection redirects to login.
3. Login/bootstrap checks resolve guest state without requiring billing configuration.
4. The user signs in or signs up.

### Sign-up -> onboarding -> dashboard

1. A new account is created through Better Auth.
2. The user is routed to onboarding / recovery.
3. Onboarding creates a first team, owner membership, team settings, and active user context only if the user has no accepted membership yet.
4. After success, the protected shell resolves a usable active workspace and the dashboard loads.

### Existing user -> protected shell

1. An existing account signs in.
2. The server resolves session plus active workspace centrally.
3. Users with a usable workspace go to the protected shell.
4. Users without one go to the correct recovery surface:
   - onboarding if they truly have no accepted memberships
   - invite recovery if invite-driven recovery is available and applicable

### Invite recovery

1. An owner creates invite records for a workspace.
2. A recipient signs in with the matching email.
3. The system exposes email-scoped pending invites without requiring an active workspace first.
4. Accepting an invite creates or reuses the membership and makes it active immediately.
5. The next protected load uses the invited workspace instead of onboarding/default-team bootstrap.

### Team switching

1. A signed-in user with multiple accepted memberships opens the workspace switcher.
2. The switch action writes the active membership selection.
3. The protected shell and team-aware procedures resolve against the new active workspace.
4. Refresh/navigation must preserve the selected workspace.

During the compatibility window, any switch operation should keep `activeMembershipId` authoritative while also maintaining `activeTeamId` as needed until the legacy fallback is removed.

Current repo contract detail: `team.list` returns switcher entries keyed by
membership context, including `membershipId`, and `user.switchTeam` consumes a
`membershipId` input rather than a raw `teamId`. Dashboard switcher work should
preserve that membership-first contract unless the tenancy model itself changes.

## Protected-shell target shape

For this mission, the target shape is Midday-like:

- route protection should not rely on scattered page-local checks alone
- protected-shell bootstrap should resolve user/workspace state once and reuse it
- team/workspace primitives should be first-class, not ad hoc viewer-only behavior
- browser shell state and API current-team state must agree

This does **not** require copying Midday’s Supabase-specific mechanics; it requires copying the architectural shape using Better Auth.

Important baseline note: the current dashboard still uses page-local viewer checks rather than a single protected shell. Workers should treat centralized protected-shell bootstrap as a mission target, not as something already present.

## Local runtime contract

The agreed local contract for this mission is:

- dashboard via Portless on `dashboard.faworra.localhost:1355`
- API via Portless on `api.faworra.localhost:1355`
- existing Supabase Postgres via current Drizzle wiring

Workers should preserve one coherent local URL/cookie/origin contract across the dashboard and API.

Additional local-runtime invariants workers must preserve:

- Better Auth cookie sharing in development depends on `.faworra.localhost`
- dashboard SSR calls depend on the Portless-aware server fetch path in `apps/dashboard/src/lib/portless-fetch.server.ts`

## Billing boundary

Polar is explicitly **deferred** for this mission.

Architecture implications:

- billing must not block dashboard or API boot
- auth and protected-shell behavior must be testable without Polar
- this mission should not reintroduce a hidden runtime dependency on billing

Important baseline note: the current code still contains Polar-coupled env/runtime paths. Workers should treat removing that blocking behavior as part of the recovery, not assume it is already solved.

## What success looks like architecturally

By the end of this mission:

- the repo seams needed for auth/tenancy feel intentionally Midday-shaped
- the protected dashboard experience is centralized and deterministic
- current-team and switch-team behavior are first-class primitives
- invite-driven recovery and onboarding coexist correctly
- team state is resolved consistently across browser shell, API context, and protected queries
