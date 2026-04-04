---
name: dashboard-parity-worker
description: Implement Midday-shaped dashboard auth, onboarding, invite recovery, and workspace-switching UX on top of Faworra’s Better Auth foundation.
---

# Dashboard Parity Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this skill for features that touch:

- protected-shell/bootstrap behavior in `apps/dashboard`
- login, sign-up, sign-out, and `return_to` UX
- onboarding and recovery routing
- workspace switcher/dropdown UX
- invite-recovery browser surfaces

## Required Skills

- `midday-reference` — invoke before making route, shell, or tenancy-UX decisions; compare against Midday’s protected layout, team dropdown, and teams recovery surface first.
- `agent-browser` — mandatory before handoff for every changed browser flow.
- `ultracite` — invoke when editing JS/TS/React files so UI code stays within repo standards.

## Work Procedure

1. Read `mission.md`, mission `AGENTS.md`, `.factory/library/architecture.md`, `.factory/library/environment.md`, `.factory/library/user-testing.md`, and `.factory/services.yaml`.
2. Invoke `midday-reference` and inspect the closest Midday dashboard files before editing:
   - protected app shell/layout
   - login/onboarding routing
   - team dropdown
   - teams/invite recovery surface
3. Identify the exact browser assertions the feature completes. Do not invent new flows outside the contract.
4. Write tests first for the nearest stable seam:
   - redirect/return helpers
   - route-state utilities
   - component behavior or rendering tests where feasible
   If a feature is mostly shell/routing work, add at least one focused automated test for the core non-visual decision logic before implementing the UI flow. For `return_to` changes, include slash-backslash and encoded external regressions, not just obvious `https://` and `//` cases.
   For onboarding/input validation work, validate against canonical code sets or other approved domain sources when the product depends on real codes; length/regex checks alone are insufficient.
5. Implement the smallest Midday-shaped UI and routing change that satisfies the mission contract.
6. Run the scoped validators from `.factory/services.yaml`.
7. Use `agent-browser` to manually verify every changed browser flow end-to-end. Each verified flow must be recorded in the handoff.
8. If the UI depends on a missing API primitive or unresolved routing/product decision, stop and return to the orchestrator instead of inventing a workaround.

## Example Handoff

```json
{
  "salientSummary": "Replaced page-local auth routing with a Midday-shaped protected shell flow, then added the workspace switcher and verified sign-in, protected entry, switch, and sign-out behavior in the browser.",
  "whatWasImplemented": "Centralized dashboard workspace bootstrap, aligned safe `return_to` handling with the protected shell, added single-team vs multi-team switcher states, and ensured the selected workspace stayed consistent across refresh and protected navigation.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "bun test --max-concurrency=6 apps/dashboard/src packages/api/src packages/auth/src packages/env/src",
        "exitCode": 0,
        "observation": "Dashboard-focused tests passed."
      },
      {
        "command": "bun x ultracite check apps/dashboard/src packages/api/src packages/auth/src packages/env/src",
        "exitCode": 0,
        "observation": "Scoped lint/format checks passed."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Visited /dashboard while signed out, signed in with an existing workspace account, and confirmed the app returned to the protected destination.",
        "observed": "The login redirect preserved the destination and the final dashboard rendered without a 5xx."
      },
      {
        "action": "Opened the workspace switcher for a multi-team user, changed teams, refreshed the page, and revisited a protected route.",
        "observed": "The selected workspace persisted and both the shell label and protected content reflected the new team."
      },
      {
        "action": "Signed out from the dashboard and retried /dashboard.",
        "observed": "The app returned to a signed-out surface and protected entry redirected back to login."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "apps/dashboard/src/lib/return-to.test.ts",
        "cases": [
          {
            "name": "unsafe return_to falls back to dashboard",
            "verifies": "External or malformed return targets are neutralized."
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- The feature needs an API primitive or server behavior that does not exist yet.
- The required browser recovery surface is ambiguous (for example onboarding vs invite recovery) and the contract does not settle it.
- Manual browser verification cannot be completed because the runtime contract is broken.
- The smallest viable implementation would violate the Midday-first rule or introduce a Faworra-old-driven pattern.
