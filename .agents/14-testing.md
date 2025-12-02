# Testing Strategy

Current State
- Some tests exist (e.g., `tests/auth/phase6-security.test.ts`). Expand coverage incrementally.
- Manual testing via dev servers remains common.

When Adding Tests
- Unit: query functions and utilities.
- Integration: tRPC routers and REST endpoints.
- E2E: critical user flows.
- Use Vitest for speed and good DX.

CI Expectations
- Run tests alongside typecheck/lint; PRs fail on test failures.

Guidelines
- Keep tests deterministic and tenant‑scoped; seed minimal fixtures.
- Prefer testing behaviors over implementation details.
