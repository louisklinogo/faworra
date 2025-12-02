# Quality & Performance Standards Audit of AGENTS.md

Author: Senior Engineer & Architect Review
Date: 2025-10-20

## Executive Summary

AGENTS.md establishes a strong, production-grade baseline: server-first architecture, strict multi-tenancy, Zod validation, RLS security, performance-minded data flow (initialData), and CI gates for type and schema drift. However, several enforcement gaps and configuration drifts prevent it from achieving “top standard” in practice. Addressing the highlighted misalignments (lint/CI enforcement, query scoping automation, Link prefetch policy, and testing) will raise the bar to elite quality and performance.

Verdict: Solid foundation with clear intent, not yet fully enforced. Fix P0/P1 issues below to reach top standard.

---

## What’s Strong (Aligns with Top Standards)

- Server-first, initialData pattern mandated across pages; matches modern Next.js RSC best practice and reduces waterfalls/double-fetching.
- Multi-tenancy as a first-class invariant: team_id scoping, RLS on, clear “never trust client-provided team_id.”
- Strong typing and Zod validation end-to-end; consistent `{ error: string }` response shape; `.returns<T>()` guidance.
- CI/CD intent: typecheck/lint/build gates; Supabase types drift protection; Husky pre-commit.
- Security hygiene: server-only secrets, signed storage URLs, RLS policies.
- Performance posture: minimal selects, indices for hot filters, no N+1.
- UI/UX parity directive to reuse proven components/patterns (Midday) to avoid design drift.

These are the right pillars for quality, safety, and performance at scale.

---

## Gaps, Risks, and Inconsistencies Found

1) “No any” policy is not enforced and examples contradict it
- Policy: AGENTS.md prohibits `any` in application code.
- Reality: The linter config (biome.json) disables `noExplicitAny`, so `any` is allowed. Repo grep shows usage in app/packages.
- Even AGENTS.md examples use `any[]` in client component props.
- Risk: Silent type regressions and weak contracts in critical paths.
- Fix (P0):
  - Turn on Biome’s `noExplicitAny` with severity “error”.
  - Replace guide examples using `any` with generics or `unknown` plus safe parsing.
  - Add CI check: fail on `any` except in vetted, commented exceptions.

2) CI build step is misconfigured; will fail
- File: .github/workflows/ci.yml
- Issue: Uses `bun run build:admin` but root package.json only defines `build:dashboard`.
- Risk: CI “Build” job fails, masking real regressions.
- Fix (P0): Replace `build:admin` with `build:dashboard`.

3) CI Supabase types drift check path is wrong in ci.yml
- ci.yml checks `packages/supabase/src/types/database.ts` but generated output is `database.generated.ts` (correct in supabase-types-drift.yml).
- Risk: Drift goes undetected or CI is flaky.
- Fix (P0): Align the file path in ci.yml with `database.generated.ts`.

4) “Block unscoped queries” is not automatically enforced
- Policy exists, but there is no guardrail ensuring `team_id` is present in every DB read/write.
- Risk: Accidental tenant data leaks or elevated blast radius.
- Fix (P0/P1):
  - Introduce a “team-scoped DB” wrapper that requires `teamId` as an explicit parameter and injects scope in all query builders.
  - Add static checks: AST/regex rule to flag `.from(<table>)` without `eq(<table>.teamId, ctx.teamId)` (or approved alternatives).
  - Add RLS integration tests against anon key to prove enforcement.

5) “No client prefetch for initial loads” lacks enforcement
- Next.js Link prefetch defaults can reintroduce double-fetch; no centralized policy/check in the repo.
- Risk: Performance regressions via implicit prefetch.
- Fix (P1):
  - Wrap Next Link in a shared component with `prefetch={false}` by default; ban raw `next/link` via lint rule or codemod.
  - Add a Biome custom rule or code mod to flag `prefetch` omissions outside the wrapper.

6) Testing is stated as “planned”, not implemented
- Policy: quality-first, but repo lacks a minimal automated test baseline.
- Risk: CI “green” without behavioral coverage; regressions in RLS, team scoping, tRPC procedures.
- Fix (P1):
  - Seed Vitest for unit tests in queries and utilities.
  - Add API/tRPC integration tests (happy path + unauthorized + wrong team) using anon vs service-role keys.
  - Gate PRs on passing tests for critical modules.

7) Observability policy is declared but not uniformly implemented
- Policy mentions structured logs and request id, team_id.
- Reality: Not centrally enforced; API/Worker should share a logger and middleware injecting correlation IDs.
- Fix (P1):
  - Provide a shared logger package (pino/console structured) and Hono middleware to inject/request-id + team_id.
  - Require its use in API/Worker; add a lint ban on `console.log` outside logger module.

8) Policy/docs duplication increases drift risk
- AGENTS.md and docs/engineering-constitution.md overlap and can diverge.
- Fix (P2): Make engineering-constitution the single source of truth and have AGENTS.md link to it. Keep only deltas in AGENTS.md.

---

## Verification Snapshot (Repo State)

- Lint config: biome.json disables `noExplicitAny` → contradicts policy.
- CI workflow:
  - ci.yml uses `build:admin` (does not exist) and checks wrong Supabase types file.
  - supabase-types-drift.yml uses the correct `database.generated.ts`.
- Type safety: strict TS in tsconfig.base.json; good baseline but undermined by allowed `any`.
- Supabase types: present at `packages/supabase/src/types/database.generated.ts`.
- Pre-commit: Husky installed; ensure hooks actually run the type drift check or rely on CI.

---

## Performance Posture Review

- InitialData pattern is explicitly mandated and described with examples; this is excellent for reducing client waterfalls and maintaining responsive UIs.
- Recommendations to reach top tier:
  - Add a performance budget and regression checks (e.g., Lighthouse CI for the dashboard, or Web Vitals reporting to a metrics sink).
  - Define DB index policy and verify indexes on top filters used in Transactions/Inbox (team_id, status, created_at, category_id). Maintain `scripts/pg-perf.sql` as the canonical index audit.
  - Enforce “lean selects” with query helpers that enumerate columns; ban wildcard selects in code review and via lint rule/code mod.
  - Codify cache strategy: tRPC response caching policies and invalidation on mutation (already documented; ensure usage is audited).

---

## Security & Multi-Tenancy Review

- RLS-first with explicit team_id scoping is the correct posture.
- Concrete improvements:
  - Add an automated “RLS verification” job that runs with anon key against representative endpoints/queries and fails on data leakage.
  - Store secret scanning and key rotation guidance; run a secret scanner in CI.
  - Ensure signed URL expirations are short and never logged.

---

## Developer Experience & Consistency

- UI/UX parity with Midday is clear; avoid improvisation. This is good for speed and coherence.
- Provide a PR template that copies the PR checklist from AGENTS.md and requires reviewers to acknowledge: team scoping, typing, Zod validation, performance, and RLS.
- Align all scripts in CI with package.json to avoid drift (the current `build:admin` mismatch is a prime example).

---

## Prioritized Action Plan

P0 – Immediate (broken CI / weakened enforcement)
1. CI: Replace `build:admin` with `build:dashboard` in ci.yml.
2. CI: Fix Supabase drift check file path in ci.yml to `packages/supabase/src/types/database.generated.ts`.
3. Lint: Enable `noExplicitAny` as an error in biome.json; replace `any` usage with generics/unknown or narrow types; update examples in AGENTS.md.
4. Guardrails: Introduce enforced team-scoped DB wrapper and static checks for unscoped queries.

P1 – Near Term (quality/perf assurance)
5. Testing: Seed Vitest for unit/integration tests; add RLS/tenancy tests using anon and service role keys; gate PRs.
6. Performance controls: Add Link wrapper with `prefetch={false}` default; add code rule banning raw `next/link` in app code.
7. Observability: Ship shared logger + correlation ID middleware for API/Worker; ban raw console logs.

P2 – Medium Term (polish & sustainability)
8. Single-source policy: Consolidate AGENTS.md with engineering-constitution to avoid drift; keep policy in one place.
9. Performance budget: Add Lighthouse CI/Web Vitals pipeline; set SLOs and alert on regressions.
10. Security hygiene: Secret scanner in CI and documented key rotation playbook.

---

## Policy → Enforcement Mapping (What to Automate)

- No `any` → Biome `noExplicitAny: error`; CI gate; curated exceptions only with comments.
- No unscoped queries → Team-scoped DB wrapper + static checks on `.from()`/`where()`; RLS tests.
- InitialData pattern → Lint rule or code review checklist; wrapper utilities that make the pattern the path of least resistance.
- No client prefetch for initial loads → Shared Link wrapper with `prefetch={false}` + rule banning raw `next/link`.
- Types drift → Both CI workflows align on `database.generated.ts`.
- Minimal selects / no `select *` → Custom lint rule/code mod + query helper factories with explicit column lists.
- Structured logs with request id, team_id → Shared logger package + middleware; ban unstructured console.

---

## Final Assessment

AGENTS.md sets the right standards and demonstrates an understanding of high-scale, secure, and performant SaaS patterns. To truly uphold “top standard,” you must close the loop with enforcement and working CI. Fix the P0 items immediately, institute hard guardrails for tenancy, re-enable strict typing, and bring testing + observability online. With these changes, the guidance in AGENTS.md will not only be aspirational but reliably realized across the codebase.
