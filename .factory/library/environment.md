# Environment

Environment variables, external dependencies, and setup notes for this mission.

**What belongs here:** required env vars, local URL/origin expectations, external service assumptions, and mission-specific runtime notes.
**What does not belong here:** long-running service commands or ports (use `.factory/services.yaml`).

---

## Required runtime surfaces

This mission depends on:

- Bun/Turbo workspace tooling
- existing `node_modules` at the repo root or `bun install`
- Better Auth for identity/session handling
- existing Supabase Postgres connection via `DATABASE_URL`
- Portless-local dashboard/API access on `*.faworra.localhost`

## Required env files

Workers should expect these env files to exist:

- `apps/api/.env`
- `apps/dashboard/.env`

`packages/db/drizzle.config.ts` reads database configuration from `apps/api/.env`.

## Server envs that matter for this mission

The in-scope runtime depends on:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `CORS_ORIGIN`
- `NEXT_PUBLIC_SERVER_URL`

## Billing note

Polar is explicitly deferred for this mission.

That means:

- dashboard and API boot must not require active Polar configuration
- auth/session flow must work without billing
- any remaining `POLAR_*` coupling in boot/render paths is a bug to remove during this mission

## Local URL contract

The agreed browser/API contract for this mission is:

- dashboard: `http://dashboard.faworra.localhost:1355`
- API: `http://api.faworra.localhost:1355`

Development cookie sharing depends on the `.faworra.localhost` hostname family in `packages/auth`.

## Portless / SSR note

Dashboard SSR calls to the API rely on `apps/dashboard/src/lib/portless-fetch.server.ts` for `*.localhost` handling.

If a change breaks server-side dashboard -> API fetches on the local hostname contract, that is a regression.

## Compatibility-only areas

These surfaces exist in the repo but are not primary mission targets:

- `apps/mobile`
- `apps/docs`

Workers should touch them only when required to keep the in-scope auth/tenancy foundation coherent.
