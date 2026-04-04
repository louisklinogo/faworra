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

## Flow Validator Guidance: Browser surface

- Use the `agent-browser` skill and never use the default session.
- For this worker session, browser validators must use isolated session ids derived from `b7573f126b70`, such as `b7573f126b70__login`.
- Stay on the Portless dashboard origin: `http://dashboard.faworra.localhost:1355`.
- Do not create or mutate shared authenticated state unless the assigned assertion explicitly requires it; the preflight browser assertion is guest-only and should remain signed out.
- Capture at least one screenshot, console errors, and the network requests relevant to `/login` and its guest bootstrap/session calls.
- Save browser evidence only under the assigned mission evidence directory for the validator group.

## Flow Validator Guidance: API surface

- Use `curl` against the real API origin: `http://api.faworra.localhost:1355`.
- Do not mutate database or auth state for preflight checks; the API preflight assertion is a health-only read.
- Record exact HTTP status codes and response bodies for the health surface.
- Save terminal evidence only under the assigned mission evidence directory for the validator group.
