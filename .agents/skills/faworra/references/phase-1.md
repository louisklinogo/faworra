# Phase 1 Reference

## What Phase 1 is for

Phase 1 is about normalizing `faworra-new` into a Midday-aligned foundation. It is not the phase where the entire business OS is implemented.

## In scope

- role-based app naming and mapping
- keeping the scaffold aligned to the renamed `apps/dashboard`, `apps/api`, and `apps/mobile` structure
- Better Auth + Midday-style middleware and request context
- team model and multi-tenant foundation
- industry-neutral onboarding that creates the first workspace after signup
- schema separation between auth, core/team, and later business domains
- Portless local-dev conventions
- documentation cleanup so the scaffold no longer reads like a generic starter

## Delivered foundation in the current repo state

- `apps/dashboard/src/proxy.ts` handles optimistic route gating for `/dashboard`, `/onboarding`, and `/login`
- authoritative auth + team resolution lives in centralized API/tRPC context, not ad hoc page logic
- the onboarding flow is industry-neutral; fashion is only the pilot domain of familiarity, not a hardcoded product assumption
- onboarding creates `team`, owner membership, `team_settings`, and user context in one transaction, with `activeMembershipId` as the primary active-workspace pointer and `activeTeamId` retained as a compatibility fallback
- signed-in users without an active team are redirected into onboarding before entering the dashboard

## Midday-first working rule for Phase 1

- Phase 1 implementation work should follow Midday's organization and patterns by default.
- Check Midday before inventing a new route structure, package boundary, auth flow, or tenancy pattern.
- Only ask for clarification when Midday is unclear for the task or Better Auth makes the translation uncertain.

## Out of scope

- worker implementation
- BullMQ and Trigger.dev runtime wiring
- most business-domain packages
- marketing website implementation
- full AI operator implementation

## Portless naming

- `dashboard.faworra.localhost`
- `api.faworra.localhost`
- `docs.faworra.localhost`

Use these role-based names for trusted origins, redirects, local callback URLs, and CORS planning once Portless wiring begins.
