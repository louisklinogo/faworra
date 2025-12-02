# Core Commands

Development
- Start all services: `bun run dev` (API + Dashboard)
- API only: `bun run dev:api` (Hono :3001)
- Dashboard only: `bun run dev:dashboard` (Next.js :3000)
- Worker (WhatsApp): `bun run dev:worker`

Quality Checks
- Type‑check all: `bun run typecheck`
- API: `bun run typecheck:api`  ·  Dashboard: `bun run typecheck:dashboard`
- Lint: `bun run lint`  ·  Format: `bun run format`

Database
- Generate migrations: `bun run db:generate`
- Push schema: `bun run db:push`
- Studio GUI: `bun run db:studio`
- Generate Supabase types: `bun run db:types` → writes `packages/supabase/src/types/database.generated.ts`
- Alternative: `bun run db:types:generated`

Automation
- Pre‑commit hook regenerates types and fails on drift (Husky).
- CI “Supabase Types Drift Check” regenerates types; fails PRs on drift (needs `SUPABASE_ACCESS_TOKEN`).
