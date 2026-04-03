---
name: api-parity-worker
description: Implement Midday-shaped auth, request-context, and tenancy primitives in the API/database layer while preserving Faworra’s explicit divergences.
---

# API Parity Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this skill for features that touch:

- tRPC context and protected procedure boundaries
- `user.me`, `team.current`, `team.list`, `user.switchTeam`
- current-workspace resolution semantics
- invite APIs and invite safety rules
- DB-backed tenancy behavior in `packages/api` / `packages/db`

## Required Skills

- `midday-reference` — invoke before changing routers, context, or team semantics; compare against Midday’s user/team routers and middleware first.
- `ultracite` — invoke when editing JS/TS code so the implementation follows repo standards.

## Work Procedure

1. Read `mission.md`, mission `AGENTS.md`, `.factory/library/architecture.md`, `.factory/library/environment.md`, and `.factory/services.yaml`.
2. Invoke `midday-reference` and inspect the matching Midday router/context files before editing:
   - user/team routers
   - request-context / protected procedure patterns
   - current-team and switch-team behavior
3. Identify the exact behavioral assertion(s) the feature completes. Do not broaden into unrelated domain work.
4. Write failing tests first in the closest relevant test seam:
   - `packages/api/src/lib/*.test.ts`
   - router-level tests if added
   - DB-backed behavior tests for invites, switching, or resolution precedence
5. Implement the smallest Midday-shaped change that preserves Faworra’s approved divergences:
   - Better Auth stays the identity provider
   - `activeMembershipId` remains the source of truth
   - `activeTeamId` stays compatibility-only until cleanup
6. Verify with direct API checks after tests pass:
   - guest vs authenticated vs team-ready behavior
   - current-team primitives
   - invalid team switch rejection
   - invite acceptance / invalid invite safety
7. Run the scoped validators from `.factory/services.yaml`.
8. In the handoff, include exact seeded scenarios, status codes, and post-mutation state observations. If behavior depends on precedence rules, state which seeded conflict was verified.

## Example Handoff

```json
{
  "salientSummary": "Added Midday-shaped current-workspace primitives and switch semantics on top of Faworra’s membership-first tenancy model, then verified guest/teamless/ready boundaries plus safe rejection for inaccessible team switches.",
  "whatWasImplemented": "Implemented `user.me`, `team.current`, `team.list`, and `user.switchTeam`, updated context/protected procedures to expose deterministic workspace state, and preserved `activeMembershipId` precedence over the legacy `activeTeamId` fallback.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "bun test --max-concurrency=6 packages/api/src packages/db/src packages/env/src",
        "exitCode": 0,
        "observation": "API and tenancy tests passed, including seeded precedence and invalid-switch cases."
      },
      {
        "command": "bun x ultracite check packages/api/src packages/db/src packages/env/src",
        "exitCode": 0,
        "observation": "Scoped lint/format checks passed."
      },
      {
        "command": "curl -sf http://api.faworra.localhost:1355/trpc/team.current",
        "exitCode": 0,
        "observation": "Authenticated current-team primitive returned the active workspace JSON."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Seeded a user with conflicting activeMembershipId and activeTeamId references, then read the current-team primitives after sign-in.",
        "observed": "The resolved workspace followed activeMembershipId precedence and protected team data matched the same team."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "packages/api/src/lib/team.test.ts",
        "cases": [
          {
            "name": "activeMembershipId wins over conflicting activeTeamId",
            "verifies": "Workspace resolution follows the membership-first invariant."
          },
          {
            "name": "invalid switch target leaves previous workspace active",
            "verifies": "Rejected team-switch attempts do not mutate current workspace state."
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- The feature requires a new browser surface or route decision that is not already approved.
- The existing schema cannot support the required behavior without a larger migration than the feature scope allows.
- Midday parity and the current mission scope point in different directions and the tradeoff is not obvious.
- Validation depends on credentials or external state the worker cannot obtain.
