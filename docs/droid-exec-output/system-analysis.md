# System Analysis: AI Agents Readiness (Mastra) and Architecture Audit

Date: 2025-10-22

## Executive Summary

- Your stack (Next.js 15 RSC + Hono API + tRPC + Drizzle + Supabase) is a solid, server‑first foundation for AI agent automation.
- You already have the right primitives for multi‑tenancy, performance, and security: team_id scoping, RLS, initialData, indexes, and a worker process.
- The codebase is agent‑ready with minimal work: Postgres/pgvector migrations exist, and a service stub references “PostgreSQL‑backed Mastra storage.”
- Key gaps to close before production agents: a dedicated agents package/service, storage configuration for Mastra (@mastra/pg), background run orchestration, and CI/typecheck fixes.

Outcome: You can integrate Mastra in a new package and expose typed agent tools that automate current form‑based flows (create/update Clients, Orders, Invoices, Transactions) with Zod validation and strict team scoping.

---

## What We Reviewed (Evidence)

- Monorepo structure and scripts: `package.json`, `tsconfig.base.json`, apps/*, packages/*
- API entry and tRPC context: `apps/api/src/index.ts`, `apps/api/src/trpc/init.ts`, routers/*
- Worker capabilities: `apps/worker/src/index.ts` (polling, outbox processing)
- DB schema and migrations: `packages/database/src/schema.ts`, `drizzle/manual-migrations/*.sql`
  - pgvector and FTS present (`0013_add_ai_embeddings.sql`, `0015_add_transactions_fts.sql`)
- Existing “Mastra” hint: `packages/services/src/supabaseDatabase.ts` (error mentions Mastra storage)
- Prior repo analysis docs: `docs/droid-exec-output/*`

---

## Architecture Readiness

Strengths
- Server‑first pattern with RSC initialData and tRPC mutations; reduces network chatter and double fetches.
- Strong tenancy model: teamProcedure + RLS + schema indexes scoped by team_id.
- Drizzle queries and zod validators across endpoints; consistent error shape.
- Worker process for async work (communications outbox, Baileys integration) — a natural place to run agent jobs.
- Postgres features already enabled for AI/RAG: pgvector + FTS (GIN/trgm) migrations present.

Gaps/Risks
- No dedicated place yet for agents/workflows/tools; no Mastra packages installed.
- No persistent agent store configured (Mastra Postgres storage not wired). Supabase URL helper exists but unused.
- Background orchestration is polling‑based; no explicit job queue for long‑running agent runs or retries.
- Observability is partial: tRPC timing middleware exists; no unified structured logger/context shared across API/Worker/Agents.
- Typecheck for API fails locally (missing `typescript` in devDeps or using raw `tsc` instead of `bunx tsc`).

---

## Mastra Integration Plan (Minimal, Safe, Typed)

Goals
- Automate form‑based flows using agents with strict validation and tenancy safety.
- Keep architecture aligned with current patterns (server‑first, tRPC, Drizzle, Zod, RLS).

Proposed Topology
1) New package: `packages/agents/`
   - Dependencies: `@mastra/core`, `@mastra/server`, `@mastra/pg`
   - Exposes a Mastra instance configured with PostgresStore using Supabase DB URL.
   - Registers domain‑specific tools (Transactions, Invoices, Clients, Orders).

2) API exposure (pick one):
   - Option A (recommended): add a Hono subrouter in `apps/api` at `/agents/*` using `@mastra/server` handlers (streaming/chat endpoints, workflows). Auth via existing middleware; inject `teamId` from tRPC context equivalent.
   - Option B: add thin tRPC procedures that call Mastra agents programmatically for single‑shot automations.

3) Async execution:
   - Reuse `apps/worker` to run background agent jobs pulled from a DB table (e.g., `agent_runs`, `agent_events`) or directly via Mastra workflows with Postgres storage.
   - Ensure idempotency keys for side‑effecting tools (allocate payments, send messages).

4) Storage
   - Use `@mastra/pg` PostgresStore with `SUPABASE_DB_URL` (you already validate this in `packages/services/src/supabaseDatabase.ts`).
   - pgvector is enabled; memory embeddings can be persisted if you enable memory for agents.

5) Security & Tenancy
   - Every tool function must accept `{ teamId, userId }` and enforce team scoping at the SQL layer.
   - Zod schemas guard tool inputs; reject unsafe/ambiguous natural language by converting to validated structs first.

Implementation Sketch
- New package `packages/agents/src/index.ts`:
  - Create `PostgresStore({ connectionString: SUPABASE_DB_URL })`.
  - Instantiate `Mastra({ storage })`.
  - Define tools (e.g., `createTransactionTool`, `createInvoiceTool`) with Zod schemas; internally call Drizzle or tRPC server‑side helpers filtered by `teamId`.
  - Register an `Agent` that first maps NL to a validated input (use Zod + rule‑based prompt) then calls the proper tool.

API Hookup
- `apps/api/src/index.ts`: mount Mastra server handlers under `/agents/*` with your existing CORS and auth middleware. Inject `teamId` into the request context; block calls without a team.

Observability
- Add a thin wrapper logger (pino/consola) shared across API/Worker/Agents with request/trace id and team_id fields. Replace `console.*` gradually.

---

## Concrete Scopes (Phase 0 → Phase 2)

Phase 0 — Baseline and Guardrails (1–2 days)
- Add devDeps and package: `@mastra/core`, `@mastra/server`, `@mastra/pg`.
- Fix typecheck for API: either add root `typescript` devDep or change `typecheck:api` to `bunx --bun tsc --noEmit`.
- Create `packages/agents` with `Mastra` instance and `PostgresStore(SUPABASE_DB_URL)`.
- Ship one read‑only tool: `listRecentTransactions(teamId, limit)` to validate storage, auth, and wiring.

Phase 1 — Form Automation MVP (2–4 days)
- Tools:
  - `createTransaction` (Zod‑validated union matching existing create mutation; stores attachments/tags)
  - `createInvoice` (per existing schema and uniqueness rules)
  - `createClient`
- Agent:
  - “Form Filler” agent that converts NL into the Zod schema and invokes the tool; returns a structured result for UI.
- API:
  - Hono route `/agents/form-filler` (streaming) or tRPC mutation `agents.formFiller.run`.
- Async:
  - For long tasks, enqueue a row in `agent_runs` and let `apps/worker` execute via Mastra instance.

Phase 2 — Memory, RAG, and Safety (3–6 days)
- Enable Mastra memory with `@mastra/pg` (threads/messages stored with embeddings); seed with team‑specific policies and examples.
- Add tool whitelist per agent; block sensitive operations unless explicitly allowed.
- Idempotency: include `client_message_id`‑style keys (you already use this pattern in WhatsApp worker) for agent actions.
- Observability dashboards: slow/path logs (you already have tRPC timing), plus agent run traces.

---

## Detailed Findings and Recommendations

1) Storage & Data Layer
- ✅ pgvector + FTS migrations exist and align with typical agent memory/search use‑cases.
- Recommendation: adopt `@mastra/pg` for storage/memory; reuse `SUPABASE_DB_URL` validation helper (`packages/services/src/supabaseDatabase.ts`).

2) API & Access Control
- ✅ `teamProcedure` consistently enforces auth + team scoping; Hono routes use `requireAuthTeam` for protected paths.
- Recommendation: ensure `/agents/*` routes run behind the same auth and inject `teamId` into Mastra tool context.

3) Background Execution
- ✅ `apps/worker` already performs polling and idempotent outbox sends.
- Recommendation: add a small `agent_runs` table (status, input, output, error, team_id, created_at, updated_at, idempotency_key) or lean fully on Mastra’s Postgres store for workflow persistence. Process pending runs in the worker on an interval similar to outbox.

4) Tooling & Validation
- ✅ Strong Zod usage in tRPC routers (e.g., `transactions.create`, `createManual`).
- Recommendation: mirror these exact Zod schemas in Mastra tools to guarantee the agent only executes allowed, typed actions.

5) Observability
- Partial today (tRPC timing middleware). No shared structured logger across API/Worker.
- Recommendation: add a shared logger package and instrument agent runs with request/trace id + team_id. Emit slow path warnings for >200ms agent tool calls.

6) CI/Typecheck Hygiene
- `bun run typecheck:api` fails (no local `typescript` where `tsc` is invoked). Root `package.json` uses `tsc` directly for API while dashboard uses `bunx tsc`.
- Recommendation: either add `typescript` devDep at root or change the script to `bunx --bun tsc --noEmit` for API. Keep CI green before adding agents.

7) Security
- Maintain “server‑only secrets” policy; Mastra model keys (OpenAI/Claude/Gemini) must stay server‑side.
- Enforce “least privilege tools”: each agent gets a minimal toolset; sensitive operations require explicit flags.

---

## Code Sketches (for reference only)

Storage and Mastra instance (packages/agents/src/mastra.ts):

```ts
import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/pg";
import { getSupabaseConnectionString } from "@Faworra/services/supabaseDatabase";

const store = new PostgresStore({ connectionString: getSupabaseConnectionString() });
export const mastra = new Mastra({ storage: store });
```

Example tool (createTransaction) with Zod and tenancy:

```ts
import { z } from "zod";
import { tool } from "@mastra/core";
import { db } from "@Faworra/database/client";
import { transactions, transactionAttachments, transactionTags } from "@Faworra/database/schema";

const CreateTransactionInput = z.object({ /* mirror your tRPC input */ teamId: z.string().uuid(), /* ... */ });

export const createTransactionTool = tool({
  name: "createTransaction",
  description: "Create a transaction for the current team",
  schema: CreateTransactionInput,
  execute: async (input) => {
    const { teamId, /* ...rest */ } = CreateTransactionInput.parse(input);
    // Insert using Drizzle; ensure all queries filter by teamId
    const [created] = await db.insert(transactions).values({ teamId, /* ... */ }).returning();
    // Optional: attachments/tags inserts
    return { id: created.id };
  },
});
```

Mounting in Hono (apps/api/src/index.ts):

```ts
import { createMastraHandlers } from "@mastra/server"; // illustrative
import { mastra } from "@Faworra/agents/mastra";

const handlers = createMastraHandlers(mastra);
app.use("/agents/*", requireAuthTeam, handlers);
```

---

## Prioritized Checklist

P0 (now)
- Fix API typecheck script; keep CI green.
- Create `packages/agents` with `@mastra/core`, `@mastra/pg`; wire storage to Supabase DB URL.
- Add one read‑only tool and route to validate end‑to‑end path.

P1 (MVP)
- Implement `createTransaction`, `createInvoice`, `createClient` tools with Zod.
- Add `/agents/*` routes (Hono) or `agents.*` tRPC mutations.
- Start worker polling for `agent_runs` or leverage Mastra workflows for persistence.

P2 (production‑ready)
- Memory + embeddings (`@mastra/pg`), safety policies, idempotency keys.
- Shared structured logger, slow‑path alerts, and run tracing.
- Tool whitelists per agent and permission model tied to team roles.

---

## Bottom Line

You are 80–90% infrastructure‑ready for Mastra agents. Add a focused `packages/agents` with Postgres storage, wire tools that wrap your existing typed mutations, and expose a guarded `/agents/*` API. Close the few CI/observability gaps and you can safely automate form‑based flows with agents while preserving your tenancy and performance guarantees.
