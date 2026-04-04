# Validation

Mission-scoped validation notes discovered during scrutiny.

- The current commands in `.factory/services.yaml` cover install, test, typecheck, lint, and build, but they do **not** check workspace manifest ↔ `bun.lock` consistency.
- When a feature removes or reroutes a workspace dependency, verify that both the workspace `package.json` entry and the matching `bun.lock` workspace block are updated. A stale lockfile entry can preserve dependency drift even when tests, typecheck, and lint still pass.
