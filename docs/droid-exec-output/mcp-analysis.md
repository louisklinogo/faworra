# MCP Feasibility Analysis — Faworra Platform

Date: 2025-10-22

## Executive Summary

- Building an MCP (Model Context Protocol) server for Faworra is feasible and straightforward with the current monorepo architecture (Bun, Hono + tRPC, Drizzle, Supabase). 
- Best-fit approach: implement a stdio MCP server as a new workspace (apps/mcp-server or packages/mcp-server) that authenticates via Supabase Bearer tokens, enforces team scoping, and exposes a focused set of tools mapped to existing tRPC routers and database query functions.
- The platform’s strong multi-tenancy (team_id), clear query layer (packages/database/src/queries/*), and exported tRPC appRouter enable clean integration paths with good type safety.

## Current Architecture (Relevant Highlights)

- Monorepo on Bun with apps (dashboard/api/worker) and packages (database/supabase/ui/etc.).
- Backend: Hono server with tRPC (apps/api); appRouter exported for potential in-process usage.
- Data: Drizzle ORM in packages/database; schema is multi-tenant with enforced team_id scoping patterns; good query organization per domain.
- Auth: Supabase; API context derives user and currentTeamId from token; RLS on; service-role admin client available when needed.
- Frontend: Next.js 15 Server Components; client interactivity via tRPC hooks; initialData pattern in flight and aligning with Midday patterns.

These characteristics are strongly compatible with MCP’s stdio server model and tool abstractions.

## Integration Approaches (Ranked)

1) Direct Query Integration (Recommended)
- Description: MCP server imports packages/database query functions and calls them directly after authenticating the user and resolving teamId.
- Pros: Simple, fast, minimal dependencies, full control over team scoping; easy Zod validation; avoids HTTP/tRPC transport overhead.
- Cons: Slightly tighter coupling to internal query APIs; maintain discipline to keep team_id filters.

2) In-Process tRPC Caller (Also Good)
- Description: Import appRouter from apps/api and use appRouter.createCaller(ctx) with a locally constructed TRPCContext (replicating createTRPCContext logic: verify token via Supabase, load user.currentTeamId, attach db/supabase).
- Pros: Reuses business logic exactly as exposed via tRPC; strong alignment with API surface and shared types.
- Cons: apps/api currently exports only the router (“./trpc/routers/_app”). To use TRPCContext types or helper factories, you may add an export for “./trpc/init” (optional improvement). Slightly more indirection than direct queries.

3) HTTP tRPC Client
- Description: Call /trpc via @trpc/client (httpBatchLink) from the MCP server.
- Pros: Clean isolation; mirrors external consumers.
- Cons: Adds network/serialization overhead and more moving parts vs. in-process; less efficient for a local MCP process.

4) REST Proxy (Selective)
- Description: For specific features already exposed as REST (e.g., webhooks/communications), wrap those endpoints.
- Pros: Useful where REST already exists or where worker/side-effects are mediated.
- Cons: Mixed surfaces; less type sharing end-to-end.

Recommendation: Start with (1) Direct Query Integration or (2) In-Process tRPC Caller. Both keep code paths consistent with current architecture and minimize boilerplate.

## Authentication, Multi-Tenancy, and Security

- Authentication: Accept a Bearer token from the MCP client (passed via tool arguments or MCP session). Verify via Supabase (auth.getUser) exactly like createTRPCContext.
- Team Context: Resolve currentTeamId from users table; require it for team-scoped tools. Provide a “teams.select” tool to switch team when the user belongs to multiple teams.
- Authorization: Enforce team_id filters in every DB access (mirror teamProcedure). Never trust client-supplied team_id without verifying membership.
- RLS: Prefer user token paths (RLS on) for reads. Use service role only for server-admin tasks that must bypass RLS; still enforce team_id defensively in code.
- Validation & Errors: Validate all tool inputs with Zod; return consistent { error: string } shapes on failure per Engineering Constitution.
- Logging: Include request IDs and timing similar to tRPC timing middleware; avoid logging PII; redact secrets.

## Initial Tool Surface (Pragmatic, High-Value)

Read/search tools (low risk, immediate utility):
- health.ping → returns { status: "ok" }
- teams.current → returns current team metadata
- clients.search → search, limit, sort
- transactions.search → filters (date range, amount, tags, account, category, q)
- invoices.search → filters (status, date range, client, q)
- analytics.summary.transactions → simple aggregates for dashboard context

Create/update tools (guarded, with validation):
- clients.create → minimal fields (name, phone/email)
- transactions.create → amount, type, account, category, date, notes, tags[]
- transactions.tag → add/remove tags for a transaction
- invoices.create → client, items[], due date, amounts

Team/session tools:
- teams.list → teams user belongs to
- teams.select → set current team for subsequent tools

Side-effect tool (optional phase 2):
- communications.send_whatsapp → channel, to, message (route via existing communications API/worker; apply strict rate limits and audit trail)

Scope note: Start with read/search tools to validate MCP wiring, then add creates/mutations with careful validation and error handling.

## Transport and Packaging

- Transport: stdio (per Factory CLI support and broad MCP client compatibility).
- New workspace: apps/mcp-server (or packages/mcp-server if you prefer a library-style package consumed by a thin runner).
- Scripts:
  - "dev:mcp": "bun --hot apps/mcp-server/src/index.ts"
  - "start:mcp": "bun run apps/mcp-server/src/index.ts"
- Dependencies:
  - @modelcontextprotocol/sdk (MCP server SDK)
  - zod (validation), superjson (optional), @trpc/server (only if using in-process caller)

## Minimal Server Skeleton (Direct Query Integration)

```ts
// apps/mcp-server/src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server";
import { z } from "zod";
import { db } from "@Faworra/database/client";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { getTransactions } from "@Faworra/database/src/queries/transactions"; // example

const server = new Server({ name: "faworra-mcp", version: "0.1.0" });

// Simple auth helper (mirror apps/api createTRPCContext)
async function resolveSession(token?: string) {
  if (!token) return null;
  const supabase = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const userRecord = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, user.id) });
  return { userId: user.id, email: user.email, teamId: userRecord?.currentTeamId };
}

server.tool("health.ping", {
  schema: z.object({}),
  handler: async () => ({ status: "ok" }),
});

server.tool("transactions.search", {
  schema: z.object({
    token: z.string().optional(),
    teamId: z.string().optional(),
    q: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.number().min(1).max(200).default(50),
  }),
  handler: async (input) => {
    const session = await resolveSession(input.token);
    const teamId = input.teamId ?? session?.teamId;
    if (!session?.userId || !teamId) return { error: "Not authenticated or no team selected" };
    const items = await getTransactions(db, { teamId, q: input.q, from: input.from, to: input.to, limit: input.limit });
    return { items };
  }
});

server.start();
```

Notes:
- Keep all tools behind token + team checks; never accept arbitrary teamId without verifying user membership.
- Use Zod schemas to validate and coerce inputs.
- For in-process tRPC calls, import appRouter and use `appRouter.createCaller(ctx)` instead of calling queries directly.

## Observability, Limits, and UX

- Timeouts: MCP clients often enforce ~30–60s. Keep tools fast; chunk or paginate results for large payloads.
- Result shaping: Return minimal columns, paginate, and favor summaries/aggregates where useful.
- Logging: Include per-call request IDs and timing; emit warning logs on slow calls (mirror tRPC timing middleware).
- Rate limiting: Consider per-user/per-team limits on mutation tools; add simple counters if exposed via MCP routinely.

## Risks and Mitigations

- Package boundary and types: If you choose in-process tRPC callers, consider exporting TRPCContext types/helpers from apps/api (add an export for "./trpc/init"). Mitigation: start with direct query integration.
- Security drift: Service role misuse. Mitigation: default to user token paths; only use service role for strictly server-managed operations with additional guards.
- Payload size/timeouts: Long responses get truncated/time out. Mitigation: enforce sensible limits (limit 50–100 items), add pagination cursors.
- Multi-tenancy errors: Missing team context. Mitigation: expose teams.current and teams.select tools; always assert teamId is set before queries.

## Delivery Plan (Indicative)

- Day 0.5–1: Scaffold MCP server workspace, wiring, health.ping, teams.current, clients.search.
- Day 1–2: Add transactions.search, invoices.search; pagination/filters; input validation; logging/timing.
- Day 2–3: Add first mutation tools (clients.create, transactions.create) with strict validation, error shapes, and audit logs.
- Day 3+: Optional communications.send_whatsapp via existing worker/API; add rate limits and opt-in flags.

## Conclusion

You can create an MCP server today with minimal friction. Start with a stdio MCP server in the monorepo, authenticate via Supabase token, enforce team_id scoping, and expose a lean toolset mapped to your existing queries/routers. Prefer direct query integration or an in-process tRPC caller for simplicity and type safety. Expand scope incrementally once the read/search tools prove stable and performant.
