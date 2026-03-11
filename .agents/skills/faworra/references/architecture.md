# Architecture Reference

## Core stance

- Faworra builds **on top of Midday's architecture**, not beside it.
- Prefer Midday's app/package split, data flow, and request-boundary patterns before introducing custom structure.
- Reuse proven shapes, then adapt only where Faworra's confirmed product requirements differ.
- Check Midday's organization and ownership patterns before making structural decisions.
- Only ask for clarification when the Midday reference has been checked and the correct path is still unclear.

## Current scaffold mapping

- `apps/dashboard` -> main authenticated product app
- `apps/api` -> Hono + tRPC API app
- `apps/mobile` -> mobile app scaffold
- `apps/docs` -> current docs surface retained during Phase 1

## Structural rules

- Apps own surfaces and runtime entrypoints.
- Packages own reusable domain, infrastructure, and cross-app logic.
- Postgres is the source of truth; queues and workflows are execution layers.
- Do not create new packages until you have checked whether Midday already solved the same boundary.
- Do not introduce a new layout, route shape, or package boundary without first checking Midday for the existing pattern.

## Deliberate Faworra deviations from Midday

- Better Auth replaces Supabase Auth.
- `packages/auth` becomes a first-class shared package.
- Portless is the preferred local-dev URL strategy.
- `apps/docs` stays for now even though Midday uses a website app shape.

## Later-phase targets

- `apps/worker` for BullMQ runtime work
- `packages/job-client` and `packages/jobs` for async boundaries
- Faworra domain packages such as CRM, communications, operations, and catalog