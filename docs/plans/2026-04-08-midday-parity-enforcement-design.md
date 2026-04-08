# Midday Parity Enforcement Design

**Date:** 2026-04-08
**Status:** Approved
**Author:** Agent (Letta Code) in collaboration with Paco

---

## Executive Summary

This document defines a rigorous enforcement system for the Midday-first parity rule in the Faworra repository. The goal is to prevent agent drift from literal copy-first parity by making Midday source mapping and deviation disclosure mandatory and mechanically enforced.

The system uses a four-layer architecture:
1. **Policy declaration** — canonical repo-level rule definition
2. **Turn-level reminder** — `UserPromptSubmit` hook for immediate context
3. **Write-time control** — `PreToolUse` blocking for `Edit|Write` on parity-sensitive files
4. **Stop-time audit** — `Stop` hook for response verification

It also introduces a **parity artifact** — a machine-readable session-level record that serves as the contract between workflow and hooks.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Core Principles](#core-principles)
3. [Scope Model](#scope-model)
4. [Architecture Overview](#architecture-overview)
5. [Layer 1: Policy Declaration](#layer-1-policy-declaration)
6. [Layer 2: Turn-Level Reminder](#layer-2-turn-level-reminder)
7. [Layer 3: Write-Time Control](#layer-3-write-time-control)
8. [Layer 4: Stop-Time Audit](#layer-4-stop-time-audit)
9. [Parity Artifact Specification](#parity-artifact-specification)
10. [Blocking Rules](#blocking-rules)
11. [Required Workflow](#required-workflow)
12. [Rollout Strategy](#rollout-strategy)
13. [Risks and Mitigations](#risks-and-mitigations)
14. [Success Criteria](#success-criteria)
15. [Appendix: Parity-Sensitive Directories](#appendix-parity-sensitive-directories)

---

## Problem Statement

The Faworra project explicitly requires Midday-first parity for its presentation layer and architectural patterns. However, without operational enforcement, the agent has drifted into a pattern of:

- referencing Midday informally
- then improvising local adaptations
- creating substitute components instead of copying Midday equivalents
- failing to explicitly declare deviations

This violates the stated rule and accumulates unintended drift.

The goal of this enforcement system is to make the Midday-first rule **mechanically verifiable** and **hard to violate silently**.

---

## Core Principles

### Literal Copy-First Parity

When Midday parity is requested, the agent must:

1. Identify the exact Midday source file(s)
2. Copy implementation, styling, fonts, globals, component structure, and directory placement
3. Only adapt where technically required
4. Explicitly declare any deviation before proceeding

### No Substitute Components

The agent must not create local wrappers, redesigns, or alternative implementations when an equivalent Midday component exists.

### Deviation Must Be Explicit

Any deviation from Midday — whether due to Better Auth, Faworra-specific business logic, or technical incompatibility — must be declared with rationale.

### Parity Work Must Be Auditable

Every parity-sensitive implementation must produce an auditable record of:
- Midday source file(s)
- Faworra target file(s)
- parity mode (copy / adapted / no-equivalent)
- deviations, if any

---

## Scope Model

### Work Classes

#### Parity-Critical

Explicit requests for Midday parity, copy-first parity, or mirror behavior. Also includes work on known parity surfaces:

- Dashboard UI components
- Transactions page and related surfaces
- Sheets, filters, tables
- Layouts and routing structure
- Onboarding flow
- Middleware and request-context patterns
- Team/workspace interaction patterns
- Auth flow shape (adapted for Better Auth)

#### Parity-Adjacent

Work in areas where Midday is the architectural source of truth, even if not explicitly requested as parity:

- App boundaries
- Protected procedure patterns
- Team scoping
- UI surfaces already established from Midday

Enforcement applies, but with slightly more flexibility for local adaptation.

#### Faworra-Native

Business logic that is inherently local to Faworra:

- West Africa banking specifics (Mono, Kapso)
- Ghana-specific integrations
- Faworra-exclusive workflows
- Product semantics with no Midday analog

This should not be forced into fake parity. The agent must explicitly declare "no Midday equivalent exists" and proceed with Faworra-native design.

### Scope Boundary

Enforcement triggers when at least one of these is true:

1. User prompt explicitly references Midday/parity
2. Touched files fall under designated parity-sensitive directories
3. Parity artifact for the current session marks the task as parity-critical or parity-adjacent

This provides precision without blanket blocking.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Prompt (parity request)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: UserPromptSubmit Hook                                   │
│ - Classify prompt as parity-sensitive                            │
│ - Inject reminder: "Midday-first enforcement active"             │
│ - Initialize parity artifact if needed                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Agent Planning                                                    │
│ - Identify Midday source file(s)                                  │
│ - Declare parity mode                                             │
│ - Update parity artifact                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: PreToolUse Hook (Edit|Write)                            │
│ - Check if target file is in protected scope                      │
│ - Check if parity artifact exists and is complete                 │
│ - Block if mapping missing or deviation undeclared                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Agent Execution (Edit/Write)                                     │
│ - Proceed only if hook allows                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: Stop Hook                                                │
│ - Verify response includes Midday source reference               │
│ - Verify response includes deviation status                       │
│ - Block if disclosure incomplete                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Final Response (auditable)                                        │
│ - Source file(s) cited                                            │
│ - Adaptation status declared                                      │
│ - Deviations explained                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Policy Declaration

### Purpose

Establish a canonical, repo-level policy document that defines:

- What Midday-first means
- What literal copy-first parity requires
- What counts as acceptable deviation
- What evidence is required before edits
- How hooks enforce the rule
- What happens on violations

### Location

- Primary: `docs/policies/midday-parity-enforcement.md`
- Reference: `AGENTS.md` should remain concise and point to this policy

### Content Requirements

The policy document should include:

1. **Rule definition**
   - Midday-first explanation
   - Copy-first parity definition
   - Examples of correct vs. incorrect behavior

2. **Parity modes**
   - `copy` — literal copy-first
   - `adapted` — copy with declared deviations
   - `no-equivalent` — no Midday analog exists

3. **Deviation policy**
   - When deviation is allowed
   - What rationale is required
   - How to document it

4. **Artifact requirement**
   - Parity artifact format
   - When it must be created
   - How it is used by hooks

5. **Enforcement summary**
   - Hook layers
   - Blocking conditions
   - Warning conditions

---

## Layer 2: Turn-Level Reminder

### Hook Type

`UserPromptSubmit`

### Purpose

Classify user intent early and inject immediate context to reduce "I forgot the rule" drift.

### Behavior

1. Inspect incoming prompt for parity signals:
   - Keywords: "Midday", "parity", "copy", "mirror", "match Midday"
   - Surface names: "transactions", "sheets", "filters", "dashboard", "onboarding"
   - Explicit requests for parity behavior

2. If matched, inject a system reminder:

   ```
   Midday-first enforcement active.

   For parity-sensitive work:
   - Establish Midday source mapping before edits
   - Use literal copy-first parity
   - Declare deviations explicitly
   - Update parity artifact
   ```

3. Optionally initialize a parity artifact for the session.

### Configuration

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "If the user's message indicates Midday parity work, copy-first parity, or work on known parity surfaces (transactions, sheets, filters, dashboard UI, onboarding), inject a reminder: 'Midday-first enforcement active. Establish Midday source mapping before edits. Copy-first parity required. Deviations must be declared explicitly.'",
            "model": "haiku"
          }
        ]
      }
    ]
  }
}
```

### Non-Blocking

This layer is guidance, not the main guardrail. It should not block the prompt.

---

## Layer 3: Write-Time Control

### Hook Type

`PreToolUse` on `Edit` and `Write`

### Purpose

Block edits to parity-sensitive files unless a complete parity mapping exists.

### Protected Scopes

Files in these directories are considered parity-sensitive:

- `apps/dashboard/src/components/**`
- `apps/dashboard/src/app/**`
- `apps/dashboard/src/hooks/**`
- `apps/dashboard/src/lib/**`
- `packages/ui/**`
- `packages/api/src/context/**`
- `packages/api/src/middleware/**`
- `packages/api/src/routers/**` (for Midday-derived patterns)
- `packages/db/src/schema/**` (for team-scoped patterns)

See [Appendix: Parity-Sensitive Directories](#appendix-parity-sensitive-directories) for the full list.

### Blocking Conditions

The hook should block (exit code 2) when:

1. Target file is in a protected scope
2. Parity enforcement is active for the session (determined by artifact or prompt classification)
3. AND one of the following is true:
   - No parity artifact exists
   - Artifact has no mapped Midday source file(s)
   - Parity mode is `adapted` but no deviation is declared
   - Parity mode is `copy` but target file is outside mapped target list
   - Parity mode is `no-equivalent` but not explicitly declared

### Required Artifact Fields

For a write to be allowed, the parity artifact must have:

- `status`: `active`
- `scope`: `parity-critical` or `parity-adjacent`
- `middayFiles`: non-empty array
- `faworraFiles`: includes target file path
- `parityMode`: one of `copy`, `adapted`, `no-equivalent`
- If `adapted`: `deviations` must be non-empty

### Warning Conditions

The hook should warn (exit code 0 with stderr feedback) but not block when:

- Multiple Midday candidates exist and agent should clarify
- Mapping exists but confidence is low
- File is parity-adjacent rather than parity-critical

### Implementation Approach

The hook script should:

1. Read hook input JSON from stdin
2. Extract `tool_input.file_path` or `tool_input.path`
3. Check if path is in protected scopes
4. If yes, read parity artifact from `.letta/runtime/parity/current-task.json`
5. Validate artifact completeness
6. Exit 0 if valid, exit 2 with blocking message if not

### Example Hook Script

```bash
#!/bin/bash
# Block parity-sensitive edits without Midday mapping

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path')

# Parity-sensitive directories
protected_dirs=(
  "apps/dashboard/src/components"
  "apps/dashboard/src/app"
  "apps/dashboard/src/hooks"
  "packages/ui/src/components"
)

# Check if file is in protected scope
is_protected=false
for dir in "${protected_dirs[@]}"; do
  if [[ "$file_path" == *"$dir"* ]]; then
    is_protected=true
    break
  fi
done

if [ "$is_protected" = false ]; then
  exit 0
fi

# Check for parity artifact
artifact_path=".letta/runtime/parity/current-task.json"
if [ ! -f "$artifact_path" ]; then
  echo "Blocked: parity-sensitive file requires Midday mapping. Create parity artifact first." >&2
  exit 2
fi

# Validate artifact
status=$(jq -r '.status' "$artifact_path")
midday_files=$(jq -r '.middayFiles | length' "$artifact_path")
parity_mode=$(jq -r '.parityMode' "$artifact_path")
deviations=$(jq -r '.deviations | length' "$artifact_path")

if [ "$status" != "active" ]; then
  echo "Blocked: parity artifact not active." >&2
  exit 2
fi

if [ "$midday_files" -eq 0 ] && [ "$parity_mode" != "no-equivalent" ]; then
  echo "Blocked: no Midday source files mapped in parity artifact." >&2
  exit 2
fi

if [ "$parity_mode" = "adapted" ] && [ "$deviations" -eq 0 ]; then
  echo "Blocked: adapted mode requires declared deviations." >&2
  exit 2
fi

exit 0
```

### Configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/parity-write-guard.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Layer 4: Stop-Time Audit

### Hook Type

`Stop`

### Purpose

Verify that the final response includes proper Midday source references and deviation disclosure when parity enforcement was active.

### Behavior

1. Read stop hook input (includes `user_message`, `assistant_message`, `preceding_reasoning`)
2. Check if parity enforcement was active for this session (parity artifact exists and is active)
3. If yes, verify `assistant_message` includes:
   - Midday source file reference(s)
   - Parity mode (copy / adapted / no-equivalent)
   - If adapted: deviation explanation
   - If no-equivalent: explicit declaration

4. If verification fails, block with exit code 2 and provide feedback

### Blocking Conditions

- Parity artifact exists and is active
- BUT assistant message omits source file reference
- OR assistant message omits parity mode
- OR parity mode is adapted but no deviations mentioned

### Example Hook Script

```bash
#!/bin/bash
# Audit parity responses for completeness

input=$(cat)
assistant_message=$(echo "$input" | jq -r '.assistant_message // empty')

# Check for parity artifact
artifact_path=".letta/runtime/parity/current-task.json"
if [ ! -f "$artifact_path" ]; then
  exit 0
fi

status=$(jq -r '.status' "$artifact_path")
if [ "$status" != "active" ]; then
  exit 0
fi

# Parity enforcement was active; verify response
parity_mode=$(jq -r '.parityMode' "$artifact_path")
midday_files=$(jq -r '.middayFiles[]' "$artifact_path" | tr '\n' ' ')

# Check for Midday reference in response
if [ "$parity_mode" != "no-equivalent" ]; then
  if ! echo "$assistant_message" | grep -qi "midday"; then
    echo "Blocked: parity response must reference Midday source file(s)." >&2
    exit 2
  fi
fi

# Check for deviation disclosure if adapted
if [ "$parity_mode" = "adapted" ]; then
  if ! echo "$assistant_message" | grep -qiE "deviation|adapt|modif"; then
    echo "Blocked: adapted parity work must declare deviations." >&2
    exit 2
  fi
fi

exit 0
```

### Configuration

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/parity-response-audit.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Parity Artifact Specification

### Purpose

Provide a machine-readable record that serves as the contract between workflow and hooks.

### Location

`.letta/runtime/parity/current-task.json`

### Schema

```json
{
  "taskId": "string (UUID or descriptive ID)",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp",
  "status": "active | completed | cancelled",
  "scope": "parity-critical | parity-adjacent | faworra-native",
  "userPrompt": "string (original prompt that triggered parity work)",
  "parityMode": "copy | adapted | no-equivalent",
  "faworraFiles": ["array of file paths"],
  "middayFiles": ["array of Midday file paths"],
  "deviations": [
    {
      "file": "string",
      "reason": "string",
      "type": "technical | business | auth | other"
    }
  ],
  "approved": "boolean",
  "notes": "string (optional)"
}
```

### Field Descriptions

| Field | Required | Description |
|-------|----------|-------------|
| `taskId` | Yes | Unique identifier for the parity task |
| `createdAt` | Yes | When the artifact was created |
| `updatedAt` | Yes | When it was last modified |
| `status` | Yes | Current state of the task |
| `scope` | Yes | Classification of work (critical/adjacent/native) |
| `userPrompt` | Yes | Original user request |
| `parityMode` | Yes | How Midday is being used |
| `faworraFiles` | Yes | List of Faworra files being modified |
| `middayFiles` | Conditional | Required unless `parityMode` is `no-equivalent` |
| `deviations` | Conditional | Required if `parityMode` is `adapted` |
| `approved` | No | Whether the mapping has been approved |
| `notes` | No | Additional context |

### Lifecycle

1. **Creation**
   - `UserPromptSubmit` hook or agent creates artifact when parity work is detected
   - Initial status: `active`

2. **Update**
   - Agent updates as planning progresses
   - Adds Midday files, declares parity mode, documents deviations

3. **Completion**
   - Agent marks as `completed` after implementation
   - Stop hook verifies before allowing final response

4. **Cleanup**
   - Artifact archived or cleared after session

---

## Blocking Rules

### Hard Block Conditions

The system must block when:

| Condition | Reason |
|-----------|--------|
| Parity-sensitive file edited with no artifact | No mapping established |
| Artifact exists but has no Midday files | Source not identified |
| Parity mode is `adapted` but no deviations declared | Undeclared changes |
| Parity mode is `copy` but target outside mapped files | Scope creep |
| Parity mode is `no-equivalent` but not declared | Implicit bypass |
| Final response omits source reference | Unauditable work |
| Final response omits deviation disclosure | Incomplete transparency |

### Soft Warning Conditions

The system should warn but not block when:

| Condition | Reason |
|-----------|--------|
| Multiple Midday candidates exist | Requires clarification |
| Mapping confidence is low | May need review |
| File is parity-adjacent | Lower priority |
| Source reference is vague | Encourage precision |

---

## Required Workflow

For all parity-sensitive work, the agent must follow this workflow:

```
1. Detect parity-sensitive request
   └─► User prompt contains parity signals OR target file is in protected scope

2. Create or update parity artifact
   └─► Initialize with taskId, scope, userPrompt

3. Identify Midday source file(s)
   └─► Search Midday repo for equivalent component/pattern
   └─► Document exact file paths

4. Declare parity mode
   ├─► copy: literal copy-first
   ├─► adapted: copy with declared deviations
   └─► no-equivalent: no Midday analog exists

5. If adapted or no-equivalent, declare rationale
   └─► Document in deviations array

6. Update artifact with complete mapping
   └─► faworraFiles, middayFiles, parityMode, deviations

7. Proceed with edits
   └─► PreToolUse hook validates artifact

8. Final response must include
   ├─► Midday source file(s)
   ├─► Parity mode
   ├─► Deviation status
   └─► Remaining mismatches (if any)

9. Stop hook verifies response
   └─► Blocks if disclosure incomplete
```

---

## Rollout Strategy

### Phase 1: Visibility (Week 1)

- Add policy document (`docs/policies/midday-parity-enforcement.md`)
- Add `UserPromptSubmit` reminder hook
- Define parity artifact convention
- Document protected scopes
- **No hard blocking yet**

**Goal:** Make behavior visible and observable. Let agent and user see what parity-sensitive work looks like.

### Phase 2: Auditing (Week 2)

- Add `Stop` audit hook
- Add warnings for missing mappings
- Log violations to `.letta/logs/parity-violations.log`
- Adjust rules based on false positives

**Goal:** Tune rules, gather data, reduce noise.

### Phase 3: Soft Blocking (Week 3)

- Enable blocking `PreToolUse` for `Edit|Write`
- Scope only to highest-risk directories:
  - `apps/dashboard/src/components/**`
  - `apps/dashboard/src/app/**`
- Allow explicit bypass via `no-equivalent` declaration

**Goal:** Stop freelancing on the most sensitive surfaces.

### Phase 4: Full Enforcement (Week 4+)

- Extend to all protected scopes
- Add `Bash` blocking for dangerous repo-wide modifications
- Add reporting/metrics if useful
- Move team-level config to `.letta/settings.json`

**Goal:** Comprehensive enforcement across the repo.

---

## Risks and Mitigations

### Risk 1: False Positives

**Problem:** Hooks may block legitimate work because mapping isn't obvious.

**Mitigation:**
- Use artifact-based enforcement (explicit declaration)
- Start with narrow protected scopes
- Allow `no-equivalent` mode for true Faworra-native work
- Tune rules iteratively during Phase 2

### Risk 2: Superficial Mapping

**Problem:** Agent might satisfy the hook with weak or incorrect mappings.

**Mitigation:**
- Stop hook requires precise file path references
- Encourage full repo-relative paths (e.g., `apps/dashboard/src/components/...`)
- Log and review mappings for quality

### Risk 3: Excessive Friction

**Problem:** Developers may bypass or disable hooks if they're too burdensome.

**Mitigation:**
- Keep `.letta/settings.local.json` for experimentation
- Move team-level enforcement to `.letta/settings.json` only after validation
- Make the process explicit, predictable, and minimally invasive
- Provide clear escape hatches (`no-equivalent` mode)

### Risk 4: Midday Ambiguity

**Problem:** Some surfaces may not have a clean Midday counterpart.

**Mitigation:**
- Require explicit `no-equivalent` declaration
- Document the reason in the artifact
- Treat ambiguity as a design decision, not silent improvisation

### Risk 5: Hook Maintenance Burden

**Problem:** Hooks require ongoing maintenance as the repo evolves.

**Mitigation:**
- Keep hook scripts simple and focused
- Use configuration-driven scope lists
- Document hook behavior clearly
- Version control hooks alongside code

---

## Success Criteria

The enforcement system is successful if:

| Criterion | Measurement |
|-----------|-------------|
| No parity-sensitive edits without mapping | Blocks occur when mapping missing |
| Deviations are always explicit | Artifact capture + response disclosure |
| Responses cite source | Stop hook pass rate |
| Parity work is auditable | Artifact completeness |
| Drift is reduced | Fewer "Midday-inspired but improvisational" implementations |
| Developer trust | Hooks are not bypassed or disabled |

---

## Appendix: Parity-Sensitive Directories

The following directories are considered parity-sensitive and subject to write-time enforcement.

Based on Midday's architecture from `midday-wiki/`:

### Dashboard Application (UI and routing)

| Directory | Reason |
|-----------|--------|
| `apps/dashboard/src/components/**` | UI components (canvas, charts, forms, modals, sheets, tables, widgets, metrics, sidebar, menus) |
| `apps/dashboard/src/app/**` | Routing and page structure (including `[locale]` routes) |
| `apps/dashboard/src/store/**` | State management |
| `apps/dashboard/src/hooks/**` | Custom hooks (use-dashboard-store, use-local-storage) |
| `apps/dashboard/src/utils/**` | Utilities (responsive, styling) |
| `apps/dashboard/src/lib/**` | Design system configuration |
| `apps/dashboard/src/middleware.ts` | Auth and routing middleware |
| `apps/dashboard/src/actions/**` | Server actions (safe-action, revalidate-action) |
| `apps/dashboard/src/trpc/**` | tRPC client configuration |

### API Application

| Directory | Reason |
|-----------|--------|
| `apps/api/src/**` | All routers, context, middleware (tRPC patterns, protected procedures) |

### Mobile Application (Phase 2)

| Directory | Reason |
|-----------|--------|
| `apps/mobile/src/**` | Will follow Midday patterns when developed |

### Shared Packages

| Directory | Reason |
|-----------|--------|
| `packages/ui/src/**` | Shared UI primitives (design tokens, components) |
| `packages/db/src/**` | Database schema, queries, client (team-scoped patterns) |
| `packages/auth/src/**` | Better Auth configuration (adapted from Midday) |
| `packages/api/src/**` | tRPC routers, context |
| `packages/banking/src/**` | Banking integration |
| `packages/accounting/src/**` | Accounting logic |
| `packages/categories/src/**` | Category management |
| `packages/location/src/**` | Location data |
| `packages/plans/src/**` | Subscription plans |
| `packages/config/**` | Configuration |
| `packages/env/src/**` | Environment utilities |

### Exceptions

The following are NOT parity-sensitive:

- `apps/api/.env` (local secrets)
- `apps/dashboard/.env` (local secrets)
- `apps/docs/**` (documentation surface)
- Any file with declared `no-equivalent` mode (Faworra-native business logic)
- Files outside the protected scopes listed above

---

## Appendix: Hook Configuration Template

Final `.letta/settings.json` after full rollout:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "If the user's message indicates Midday parity work, copy-first parity, or work on known parity surfaces (transactions, sheets, filters, dashboard UI, onboarding), inject a reminder: 'Midday-first enforcement active. Establish Midday source mapping before edits. Copy-first parity required. Deviations must be declared explicitly.'",
            "model": "haiku"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/parity-write-guard.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/parity-response-audit.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-08 | 1.0 | Initial design document |

---

**End of Document**
