# Schema and Tenancy Reference

## Data platform

- Supabase Postgres is the database platform.
- Drizzle is the schema and query layer.
- RLS remains part of the tenant-isolation strategy.

## Schema split

- `schema/auth.ts` for Better Auth tables and auth-only support tables
- `schema/core.ts` or `schema/team.ts` for teams, memberships, and team settings
- `schema/core.ts` specifically owns the app-level `user_context.activeTeamId` bridge back to Better Auth users
- Later business schemas for CRM, communications, operations, catalog, finance, and documents

## Team model

- Introduce the team model from day one.
- Every tenant-owned business table must carry `team_id`.
- Team resolution should happen in middleware/context, not inside random feature code.
- On first onboarding, create the team, owner membership, team settings, and active team pointer in one transaction.
- Dashboard route gating can be optimistic, but authoritative team validation must happen in shared API context.
- Worker and workflow code must stay team-scoped even when it uses elevated credentials.
- Check Midday's tenancy organization before adding a new team-owned table or membership pattern.
- Only diverge from Midday's table responsibilities or tenancy flow when Better Auth or a confirmed Faworra requirement requires it.

## Guardrails

- Do not mix auth tables into business-domain schema files.
- Do not add business tables without deciding their `team_id` ownership.
- Do not let domain packages bypass the shared DB and tenancy patterns.