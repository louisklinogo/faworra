# User Testing

Validation surfaces, setup notes, and concurrency guidance for this mission.

**What belongs here:** how validators should exercise the real user surfaces, what tools to use, setup expectations, and concurrency limits.

---

## Validation Surface

### Browser surface

Primary surface: `apps/dashboard`

Primary tool: `agent-browser`

Expected browser entrypoints:

- `http://dashboard.faworra.localhost:1355/login`
- `http://dashboard.faworra.localhost:1355/onboarding`
- `http://dashboard.faworra.localhost:1355/dashboard`
- any invite-recovery or team-switching surface added by this mission

Browser validation should cover:

- login and sign-up entry
- protected-route redirects
- onboarding and recovery routing
- sign-out
- invite recovery browser flow
- team switcher behavior

For onboarding parity checks after selector work lands:

- treat country/currency as selector-driven Midday controls, not free-text code fields
- verify the browser surface no longer allows arbitrary raw country/currency strings to be typed and submitted
- verify required-field validation still blocks incomplete onboarding submits
- do not fail parity solely because Midday-backed selector data still contains values such as `EU` or `AQD`; those values are part of Midday's current cloned surface unless the user requests a divergence

Important notes:

- billing is out of scope; auth/dashboard validation must not depend on Polar
- dashboard login depends on API availability
- browser assertions should capture screenshots, console errors, and relevant network calls

### API surface

Secondary surface: Hono/tRPC endpoints exposed by `apps/api`

Primary tool: `curl`

Expected API entrypoints:

- `http://api.faworra.localhost:1355/`
- `http://api.faworra.localhost:1355/trpc`
- `http://api.faworra.localhost:1355/api/auth/*`

API validation should cover:

- health boot
- guest vs authenticated vs team-ready boundaries
- current-team primitives
- invite creation/list/accept/decline/revoke semantics
- invalid switch / invalid invite safety

DB-backed test setup notes:

- The mission now uses the cloud Supabase dev project `faworra-new` through `apps/api/.env`.
- If schema bootstrap or migration is required before validation, use repo Drizzle commands only.
- Do not use Supabase MCP write actions for schema/data setup; reserve MCP for read-only checks.

## Validation Concurrency

### Browser surface

Recommended maximum concurrent validators: **3**

Rationale:

- machine: 12 logical CPUs, ~7.4 GiB RAM total
- dry-run baseline: ~5.68 GiB available before starting services
- dry-run post-attempt: ~3.92 GiB available while dashboard/API startup was exercised
- usable headroom at 70% of post-attempt availability: ~2.75 GiB
- conservative estimate per browser validator session on this app: ~600-700 MiB

This makes **3** the safe mission default for browser validation.

Current auth-shell-parity adjustment:

- current machine state during this run is closer to ~2.4 GiB available while multiple droid processes and the dev servers are active
- cap browser validators at **2 concurrent sessions** for this round to avoid memory pressure

### API surface

Recommended maximum concurrent validators: **5**

Rationale:

- `curl`-based checks are lightweight relative to browser sessions
- API assertions still share the same app/database/runtime, so concurrency should stay below the hard cap even though machine headroom is adequate

## Dry Run Findings

Pre-mission dry run findings:

- dashboard booted successfully on the Portless contract
- API startup failed because Polar env validation blocked boot
- `/login` failed while the API was down

Mission implication:

- Milestone 1 must restore a billing-free validation path before downstream browser validation can pass

## Auth-shell-parity seeded fixtures

The current auth-shell validation run uses disposable seeded accounts and workspace state written to:

- `.factory/validation/auth-shell-parity/user-testing/fixtures.json`

The fixture seeding helper lives at:

- `.factory/library/auth-shell-seed-fixtures.ts`

It provisions these auth-shell test states against the real dev database:

- ready workspace user
- authenticated teamless user
- onboarding-reactivation user with an accepted membership but no active workspace context
- stale-pointer fallback user whose `activeTeamId` points at a workspace they do not belong to
- conflicting-pointer user whose `activeMembershipId` and `activeTeamId` intentionally disagree
- foreign workspace owner used for pending-invite and invalid-switch coverage

Important notes for this environment:

- the API and dashboard must be running before seeding, because the helper creates real Better Auth users via `POST /api/auth/sign-up/email`
- `curl --cookie-jar` does **not** reliably persist the secure localhost auth cookie in this environment; for authenticated API checks, capture the exact `set-cookie` value from the auth response and reuse it in a `Cookie:` header
- keep all mutations scoped to the seeded fixture users for the current namespace
- treat the seeded teamless fixture as single-use for browser retries; once a validator completes onboarding with that user, future reruns should create a fresh disposable teamless account instead of assuming the original fixture is still teamless

## Flow Validator Guidance: Browser surface

- Use the `agent-browser` skill and never use the default session.
- For this worker session, browser validators must use isolated session ids derived from `1d4e1874b95b`, such as `1d4e1874b95b__auth` and `1d4e1874b95b__onboarding`.
- Stay on the Portless dashboard origin: `http://dashboard.faworra.localhost:1355`.
- Browser validators may sign in, sign out, and complete onboarding only for the specific fixture account(s) assigned to their group.
- Do not reuse another group's browser session, auth cookies, or seeded user.
- Guest-only assertions should start from a clean signed-out browser session.
- If an assertion needs stale-cookie recovery, mutate only the cookies inside the assigned browser session and restore or discard that session afterward.
- If onboarding failure needs to be induced and no built-in server-side failure path is available through the form alone, prefer a boundary-level failure on the assigned session (for example temporarily interrupting the API request for that session) rather than changing application code or shared server configuration.
- agent-browser may not always expose the successful Better Auth sign-in POST in its visible request log; when that happens, use final URL, rendered protected state, and cookie presence/absence as corroborating auth evidence.
- Capture at least one screenshot, console errors, and the network requests relevant to `/login` and its guest bootstrap/session calls.
- Save browser evidence only under the assigned mission evidence directory for the validator group.

## Flow Validator Guidance: API surface

- Use `curl` against the real API origin: `http://api.faworra.localhost:1355`.
- Read fixture identities and workspace ids from `.factory/validation/auth-shell-parity/user-testing/fixtures.json`.
- Capture auth cookies from the exact `set-cookie` response header returned by `POST /api/auth/sign-in/email` or `POST /api/auth/sign-up/email`; do not rely on `curl --cookie-jar` alone in this environment.
- Keep cookie/header state isolated per fixture user and per validator group.
- Allowed auth-shell API mutations are limited to the specific assertions being tested (for example `onboarding.complete` for the reactivation user or `user.switchTeam` invalid-target rejection). Avoid ad-hoc writes outside the assigned fixture namespace.
- Do not delete or repurpose seeded rows belonging to another validator group.
- Record exact HTTP status codes and response bodies for the health surface.
- Save terminal evidence only under the assigned mission evidence directory for the validator group.
