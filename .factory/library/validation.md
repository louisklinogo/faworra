# Validation

Mission-scoped validation notes discovered during scrutiny.

- The current commands in `.factory/services.yaml` cover install, test, typecheck, lint, and build, but they do **not** check workspace manifest ↔ `bun.lock` consistency.
- When a feature removes or reroutes a workspace dependency, verify that both the workspace `package.json` entry and the matching `bun.lock` workspace block are updated. A stale lockfile entry can preserve dependency drift even when tests, typecheck, and lint still pass.
- `apps/dashboard` enables Next typed routes (`typedRoutes: true`), and its TypeScript program includes generated `.next/types/**/*.ts` files. When adding or renaming dashboard routes, regenerate those ignored artifacts with `bun x next typegen` from `apps/dashboard` (or by running `next dev` / `next build`) before typechecking; do **not** hand-edit `apps/dashboard/.next/types/*`.
