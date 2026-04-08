# Midday Parity Enforcement Policy

**Status:** Active
**Enforcement:** Phase 1 (Visibility)
**Last Updated:** 2026-04-08

---

## Purpose

This document defines the Midday-first parity rule for the Faworra repository and establishes the enforcement mechanism that prevents silent drift.

---

## The Rule

### Midday-First

Midday is the **source of truth** for:
- App/package boundaries
- Routing structure
- Middleware and request context
- Protected procedure patterns
- Team scoping
- UI components and layouts
- Onboarding flow
- Auth flow shape (adapted for Better Auth)

### Literal Copy-First Parity

When Midday parity is requested, the agent must:

1. **Identify** the exact Midday source file(s)
2. **Copy** implementation, styling, fonts, globals, component structure, and directory placement
3. **Only adapt** where technically required
4. **Declare** any deviation explicitly before proceeding

### No Substitute Components

The agent must NOT create:
- Local wrappers when a Midday equivalent exists
- Redesigned variants when Midday has a pattern
- Alternative implementations when Midday provides a solution

### Deviation Must Be Explicit

Any deviation from Midday — whether due to Better Auth, Faworra-specific business logic, or technical incompatibility — must be:
- Declared in the parity artifact
- Explained with rationale
- Visible in the final response

---

## Parity Modes

| Mode | Meaning | Requirement |
|------|---------|-------------|
| `copy` | Literal copy-first | Copy Midday implementation exactly |
| `adapted` | Copy with declared deviations | Document what changed and why |
| `no-equivalent` | No Midday analog exists | Declare explicitly; proceed with Faworra-native design |

---

## Work Classes

### Parity-Critical

Explicit requests for Midday parity, or work on known parity surfaces:
- Dashboard UI components
- Transactions page
- Sheets, filters, tables
- Layouts and routing
- Onboarding
- Middleware/request-context
- Team/workspace patterns

**Enforcement:** Strongest. Requires complete parity artifact.

### Parity-Adjacent

Work in areas where Midday is the architectural source of truth, even if not explicitly requested:
- App boundaries
- Protected procedure patterns
- Team scoping
- Established UI surfaces

**Enforcement:** Active. Requires parity artifact with declared mapping.

### Faworra-Native

Business logic inherently local to Faworra:
- West Africa banking (Mono, Kapso)
- Ghana-specific integrations
- Faworra-exclusive workflows
- Product semantics with no Midday analog

**Enforcement:** Declare `no-equivalent` and proceed.

---

## Parity Artifact

Every parity-sensitive task must produce a parity artifact at:

```
.letta/runtime/parity/current-task.json
```

### Required Fields

```json
{
  "taskId": "unique-id",
  "status": "active | completed | cancelled",
  "scope": "parity-critical | parity-adjacent | faworra-native",
  "userPrompt": "original request",
  "parityMode": "copy | adapted | no-equivalent",
  "faworraFiles": ["list of files being modified"],
  "middayFiles": ["list of Midday source files"],
  "deviations": [
    {
      "file": "path",
      "reason": "explanation",
      "type": "technical | business | auth | other"
    }
  ]
}
```

### When Required

- Before editing any file in a protected scope
- Before proceeding with parity-critical or parity-adjacent work
- When user prompt indicates parity work

---

## Protected Scopes

Files in these directories require parity artifact before modification.

### Dashboard Application (UI and routing)

Based on Midday's dashboard component architecture:

- `apps/dashboard/src/components/**` — UI components (canvas, charts, forms, modals, sheets, tables, widgets, metrics, sidebar, menus)
- `apps/dashboard/src/app/**` — Routing and pages (including `[locale]` routes)
- `apps/dashboard/src/store/**` — State management
- `apps/dashboard/src/hooks/**` — Custom hooks
- `apps/dashboard/src/utils/**` — Utilities (responsive, styling)
- `apps/dashboard/src/lib/**` — Design system configuration
- `apps/dashboard/src/middleware.ts` — Auth and routing middleware
- `apps/dashboard/src/actions/**` — Server actions
- `apps/dashboard/src/trpc/**` — tRPC client configuration

### API Application

Based on Midday's tRPC and Hono API architecture:

- `apps/api/src/**` — All routers, context, middleware (protected procedures, team permissions)

### Mobile Application (Phase 2)

- `apps/mobile/src/**` — Will follow Midday patterns when developed

### Shared Packages

Based on Midday's package structure:

- `packages/ui/src/**` — Shared UI primitives (design tokens, components)
- `packages/db/src/**` — Database schema, queries, client (team-scoped patterns)
- `packages/auth/src/**` — Better Auth configuration (adapted from Midday)
- `packages/api/src/**` — tRPC routers, context
- `packages/banking/src/**` — Banking integration
- `packages/accounting/src/**` — Accounting logic
- `packages/categories/src/**` — Category management
- `packages/location/src/**` — Location data
- `packages/plans/src/**` — Subscription plans
- `packages/config/**` — Configuration
- `packages/env/src/**` — Environment utilities

---

## Enforcement Layers

### Layer 1: Policy Declaration (This Document)

Defines the rule and establishes the contract.

### Layer 2: Turn-Level Reminder

`UserPromptSubmit` hook injects reminder when parity work is detected.

### Layer 3: Write-Time Control

`PreToolUse` hook blocks edits to protected files unless:
- Parity artifact exists
- Midday mapping is complete
- Deviations are declared (if adapted)

### Layer 4: Stop-Time Audit

`Stop` hook verifies final response includes:
- Midday source reference
- Parity mode
- Deviation disclosure

---

## Required Workflow

```
1. Detect parity-sensitive request
2. Create parity artifact
3. Identify Midday source file(s)
4. Declare parity mode
5. Document deviations (if adapted)
6. Proceed with edits
7. Final response cites source and deviations
```

---

## Violations

The following are violations of this policy:

| Violation | Consequence |
|-----------|-------------|
| Editing protected file without artifact | Blocked by hook |
| Missing Midday source mapping | Blocked by hook |
| Adapted mode with no deviations | Blocked by hook |
| Final response omits source reference | Blocked by hook |
| Creating substitute component when Midday exists | Must refactor |

---

## Exceptions

The following are NOT subject to parity enforcement:

- `apps/api/.env` (secrets)
- `apps/dashboard/.env` (secrets)
- `apps/docs/**` (documentation)
- `apps/mobile/**` (Phase 2, not yet mapped)
- Faworra-native business logic (declared as `no-equivalent`)

---

## Maintenance

### How to Expand Protected Scopes

When adding new features (AI, jobs, worker, desktop, etc.), expand the enforcement system:

**The `protected_dirs` array in `hooks/parity-write-guard.sh` is the single source of truth.**

#### Expansion Workflow

```
1. Identify new protected areas from Midday repo structure
2. Update hooks/parity-write-guard.sh — add to protected_dirs array
3. Update this document (Protected Scopes section)
4. Update docs/plans/2026-04-08-midday-parity-enforcement-design.md (Appendix)
5. Commit all changes together
```

#### Future Expansions Needed

| Area | Entry to add to protected_dirs |
|------|-------------------------------|
| AI integration | `"packages/ai/src"` |
| Background jobs | `"packages/jobs/src"` |
| Worker application | `"apps/worker/src"` |
| Desktop application | `"apps/desktop/src"` |

#### Note

The enforcement system does NOT need to enforce itself. If we forget to add a scope, blocks will occur when editing that area, reminding us to expand.

---

## References

- Design Document: `docs/plans/2026-04-08-midday-parity-enforcement-design.md`
- AGENTS.md: Project code standards
- README.md: Midday-first rule summary

---

**End of Policy**
