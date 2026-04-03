---
name: runtime-parity-worker
description: Recover runtime, environment, and validation seams into a Midday-aligned foundation without expanding product scope.
---

# Runtime Parity Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this skill for features that touch:

- env validation and runtime blockers
- local URL/origin/cookie contracts
- Portless/dev-server behavior
- billing deferral required to unblock auth/runtime
- scoped lint/typecheck/test/build truthfulness
- package or script seams that support auth/tenancy recovery

## Required Skills

- `midday-reference` — invoke before making any runtime, package-boundary, or flow-structure decision so the change stays Midday-shaped.
- `ultracite` — invoke when editing JS/TS files or validation commands so the work matches project lint/format expectations.
- `agent-browser` — invoke when the feature affects dashboard boot, login rendering, or another browser-observable runtime surface.

## Work Procedure

1. Read `mission.md`, mission `AGENTS.md`, `.factory/library/architecture.md`, `.factory/library/environment.md`, `.factory/library/user-testing.md`, and `.factory/services.yaml`.
2. Invoke `midday-reference` and inspect the closest Midday analogue before changing structure, runtime boot, or protected-surface wiring.
3. Identify the exact blocker or seam being fixed. Prefer the smallest change that restores Midday-shaped behavior without introducing new architecture.
4. Write tests first where the changed behavior is testable in code:
   - env parsing/helpers
   - redirect/URL helpers
   - runtime utility functions
   - script-adjacent helpers
   If a shell/script change has no direct unit-test seam, add the nearest focused testable helper first or document why runtime verification is the compensating check.
5. Implement the fix without reintroducing deferred billing dependencies. Out-of-scope services must not block boot or validation.
6. Run the scoped validators from `.factory/services.yaml` relevant to the change.
7. If the change affects browser-observable runtime behavior, use `agent-browser` to verify the real surface (for example `/login`, protected entry, or sign-out return).
8. Record exact commands, observations, and any remaining risk in the handoff. Do not hand-wave runtime behavior.

## Example Handoff

```json
{
  "salientSummary": "Removed Polar as a runtime boot dependency for the deferred-billing mission path, aligned env handling with the agreed local contract, and verified that API health plus the dashboard login surface load successfully again.",
  "whatWasImplemented": "Adjusted the auth/env/runtime seams so billing is feature-gated instead of boot-blocking, updated the dashboard-side billing calls to avoid crashing protected entry, and normalized the scoped validation commands used for the mission surfaces.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "bun test --max-concurrency=6 apps/dashboard/src apps/api/src packages/api/src packages/auth/src packages/db/src packages/env/src",
        "exitCode": 0,
        "observation": "Targeted mission tests passed."
      },
      {
        "command": "bun x ultracite check apps/dashboard/src apps/api/src packages/api/src packages/auth/src packages/db/src packages/env/src",
        "exitCode": 0,
        "observation": "Scoped lint/format checks passed."
      },
      {
        "command": "curl -sf http://api.faworra.localhost:1355/",
        "exitCode": 0,
        "observation": "API health returned OK on the agreed local contract."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Opened http://dashboard.faworra.localhost:1355/login as a signed-out user after starting the stack.",
        "observed": "Login page rendered without a 5xx and the auth entry became actionable."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "packages/env/src/server.test.ts",
        "cases": [
          {
            "name": "deferred billing mode does not require Polar boot values",
            "verifies": "API/server env parsing can succeed without Polar when billing is explicitly disabled for the mission path."
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- A fix would require changing the agreed local URL/hostname contract.
- A runtime blocker depends on credentials, infrastructure, or external services the worker cannot restore.
- The feature appears to require a broader architectural deviation instead of a Midday-shaped recovery.
- The change would force docs/mobile into primary scope instead of compatibility-only scope.
