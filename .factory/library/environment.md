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
- cloud Supabase Postgres dev project `faworra-new` (`nwhsdbihxxobasadahbq`) via `DATABASE_URL`
- Portless-local dashboard/API access on `*.faworra.localhost`

## Required env files

Workers should expect these env files to exist:

- `apps/api/.env`
- `apps/dashboard/.env`

`packages/db/drizzle.config.ts` reads database configuration from `apps/api/.env`.

## Cloud database contract

- The active database for this mission is the cloud Supabase dev project `faworra-new` (`nwhsdbihxxobasadahbq`).
- Keep the project connection string only in local env files such as `apps/api/.env`; never commit credentials or paste them into tracked mission artifacts.
- If `apps/api/.env` changes, restart the API service so Better Auth and Drizzle pick up the new `DATABASE_URL`.
- Supabase MCP may be used for read-only checks (project status, tables, advisors, logs), but not for writes.
- All schema creation and migration work must go through the repo’s Drizzle commands.

## Dependency install note

`bun install` may hang in this environment because registry/network access appears restricted.

Operational guidance for this mission:

- use the existing `node_modules` tree as the baseline
- do not add new dependencies casually
- if a feature truly requires a fresh install or new package, return to the orchestrator instead of repeatedly retrying installs

## Bun-specific gotchas

- When re-exporting helpers from packages that ultimately rely on wildcard re-exports (such as `drizzle-orm`), prefer the tracked pattern:
  - `import { and as drizzleAnd, eq as drizzleEq } from "drizzle-orm"`
  - `export const and = drizzleAnd`
  - `export const eq = drizzleEq`
- Avoid single-line re-export chains such as `export { and, eq } from "drizzle-orm"` for this mission’s package seams; Bun can fail to resolve them reliably in this environment.
- Bun test module mocking is shared across test files in the same worker process. If a shared package mock gains new exports, every test file mocking that package must update its mock factory to include the same export shape.

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
