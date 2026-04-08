# Parity Artifact Directory

This directory stores the current parity task artifact.

## Files

- `current-task.json` — Active parity mapping for the current session

## Purpose

The parity artifact serves as the contract between the agent's planning and the enforcement hooks. It records:
- Midday source file(s)
- Faworra target file(s)
- Parity mode (copy/adapted/no-equivalent)
- Declared deviations

Hooks read this file to determine whether edits are allowed.

## Lifecycle

1. Created when parity-sensitive work is detected
2. Updated as planning progresses
3. Marked complete after implementation
4. Archived or cleared after session

## See Also

- Policy: `docs/policies/midday-parity-enforcement.md`
- Design: `docs/plans/2026-04-08-midday-parity-enforcement-design.md`
