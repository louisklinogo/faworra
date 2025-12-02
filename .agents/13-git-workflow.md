# Git Workflow

Branching
- `main` (or `master`) is production. Branch work as `feature/*` or `refactor/*` from latest.

Commits
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`.
- Keep commits atomic and focused. Run `bun run typecheck` before committing.
- Include `Co-authored-by: factory-droid[bot]` when using agents.

Pull Requests
- Must pass typecheck + lint; include testing instructions; link issues; request review.
- CI gates include typecheck/lint/test/build and schema/type drift checks.

Pre‑commit/CI Automation
- Husky pre‑commit regenerates Supabase types and fails commit on drift.
- CI workflow “Supabase Types Drift Check” regenerates types and fails PRs on drift.
