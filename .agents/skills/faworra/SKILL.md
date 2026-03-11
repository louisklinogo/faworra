---
name: faworra
description: Use when working on the Faworra monorepo. Enforces Midday-first architecture, Better Auth with Midday-style middleware and request-context patterns, Supabase Postgres + Drizzle, team-scoped schema design, Portless local URLs, and the current Phase 1 scaffold normalization plan.
---

# Faworra Skill

Project-specific guidance for building Faworra on top of Midday's proven architecture while adapting the auth layer to Better Auth.

## When to Apply

Use this skill when:

- renaming or restructuring apps and packages in `faworra-new`
- designing auth, middleware, tRPC context, or protected routes
- adding schema files, tables, or multi-tenant business logic
- deciding whether a new app or package belongs in the monorepo
- configuring local dev URLs, redirects, or CORS
- planning work that should stay inside the current Phase 1 boundary

## Non-Negotiable Rules

1. **Start from Midday first.** Reuse Midday's structure and proven patterns before inventing a custom Faworra shape.
2. **Check Midday before asking.** For organization, routing, middleware, request context, onboarding, tenancy, or package-boundary decisions, inspect Midday first and only ask for clarification when Midday is unclear or Better Auth forces an adaptation.
3. **Rename and reshape before rebuilding.** The scaffold now uses `apps/dashboard`, `apps/api`, and `apps/mobile`; keep future work aligned to those Midday-style roles.
4. **Use Better Auth, not Supabase Auth.** Keep Midday's middleware and request-context architecture, but swap the auth provider.
5. **Keep Supabase as the data platform.** Use Supabase Postgres, Storage, Realtime, and RLS with Drizzle as the schema/query layer.
6. **Adopt the team model from day one.** Core tables should support `teams`, memberships, and `team_id` ownership from the start.
7. **Separate auth schema from business schema.** Auth tables stay isolated from core/team and later business-domain tables.
8. **Use Portless for local development.** Prefer role-based names like `dashboard.faworra.localhost`, `api.faworra.localhost`, and `docs.faworra.localhost`.
9. **Respect the current phase boundary.** Phase 1 focuses on scaffold normalization, auth/middleware, team model, schema separation, and local-dev ergonomics.

## Reference Files

- `references/architecture.md` — Midday-first architectural stance and app/package mapping
- `references/auth-and-middleware.md` — Better Auth + Midday middleware and tRPC context guidance
- `references/schema-and-tenancy.md` — team model, schema separation, and tenant rules
- `references/phase-1.md` — current Phase 1 scope, Portless naming, and non-goals