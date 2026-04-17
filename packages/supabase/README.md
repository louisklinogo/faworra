# @faworra-new/supabase

Supabase JS clients and generated `Database` types for PostgREST.

## Types (`src/types/db.ts`)

- **Regenerate** when the hosted Supabase schema changes (after `db:migrate` / `db:push` is reflected remotely):

  ```bash
  SUPABASE_PROJECT_ID=<project_ref> bun run supabase:types
  ```

  Use the **Reference ID** from Supabase Dashboard → Project Settings → General.

- **Auth**: first time, run `npx supabase login`. In CI, set `SUPABASE_ACCESS_TOKEN` per Supabase docs.

- **Verify** (fast drift check for columns we rely on in jobs/API):

  ```bash
  bun run verify:supabase-types
  ```

- **Source of truth**: remote Postgres / Supabase. Keep `packages/db` Drizzle migrations aligned with what is deployed before regenerating.

## Legacy script name

`bun run db:generate` inside this package is an alias for `supabase:gen-types` (not Drizzle — that lives in `@faworra-new/db`).

## CI

Pull requests and pushes to `main` / `master` run `.github/workflows/verify-supabase-types.yml`, which executes `bun run verify:supabase-types` after `bun install`.
