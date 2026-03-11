# Faworra Skill

## Structure

```
faworra/
  SKILL.md       # Main skill file - read this first
  AGENTS.md      # This navigation guide
  CLAUDE.md      # Alias to AGENTS.md
  references/    # Focused project guidance
```

## Usage

1. Read `SKILL.md` first.
2. Load only the reference file that matches the task.
3. Prefer the Midday-shaped solution unless Faworra's confirmed decisions require a deliberate deviation.

## What This Skill Guards

- Midday-first architecture decisions
- Better Auth with Midday-style middleware and request-context patterns
- Supabase Postgres + Drizzle as the data plane
- Team-scoped multi-tenancy from day one
- Separate auth/core/business schema ownership
- Portless role-based local URLs
- Phase 1 discipline for `faworra-new`

## Reference Guide

- `references/architecture.md` for app/package ownership and structural decisions
- `references/auth-and-middleware.md` for auth provider, middleware, context, and protected procedures
- `references/schema-and-tenancy.md` for schema split and team isolation rules
- `references/phase-1.md` for the current implementation boundary and local-dev conventions