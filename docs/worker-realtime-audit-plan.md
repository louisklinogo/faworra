# Worker & Realtime Consolidation Plan (2025-11-04)

## Goals
- Prevent duplicate message/event processing under horizontal scale (safe outbox claiming).
- Standardize realtime channels and payloads across transports (Socket.IO and Supabase) via a single EventBus.
- Reduce client-side duplication (single active realtime feed with fallback).
- Improve operational robustness (graceful shutdown, explicit deps, sane CORS/logging).

## Scope
- apps/worker, apps/realtime, apps/api, apps/dashboard (realtime hooks), packages/realtime (adapters/channels), logging and supabase helpers.

## Chatwoot parity learnings (applied to plan)
- Dispatcher pattern: single dispatcher with sync (realtime) + async (webhooks/side effects) listeners; avoid duplicative emit paths and guard stale updates by reloading canonical state for conversation update events.
- Job-per-send: small per-channel services (SendOn<Provider>) invoked by a send job; our outbox is retained but claimed atomically to support scale.
- Presence & scoping: account/team-scoped presence lists in Redis; standardized channel names used everywhere (server/UI).
- Anti-flood & reopen: inbound loops prevention and conversation reopen/waiting_since/first_reply tracking; to be aligned in threads later.

## Plan by Priority

### Task List (live)
- [x] P0: Safe claiming for communication_outbox (worker/outbox)
- [x] P0: Safe claiming for event_outbox (worker/events-outbox)
- [x] P0: Add explicit "pg" dep to apps/worker
- [x] P1: Centralize EventBus creation and remove API duplicate helper
- [x] P1: Standardize channels across server/UI via packages/realtime/channels
- [x] P2: Normalize Socket.IO payloads to match Supabase adapter
- [x] P2: Single realtime feed with fallback in RealtimeProvider
- [x] P3: Graceful shutdown (worker/realtime)
- [x] P3: Restrict CORS in prod; dev-only pretty logs
- [x] P3: Cleanup legacy invoice tasks; resolve counts.updated

### P0–P1 (High)
1) Safe outbox claiming (atomic, idempotent)
   - communication_outbox: apps/worker/src/services/outbox.ts
     - Replace simple SELECT with claim step (transaction + FOR UPDATE SKIP LOCKED, or UPDATE … WHERE status='queued' RETURNING …) and set status='processing'.
   - event_outbox: apps/worker/src/services/events-outbox.ts
     - Same claim approach before publish; update to delivered/queued with backoff on failure.
   - Add tests to confirm two worker processes do not process the same row.

2) Declare explicit dependency
   - Add "pg" to apps/worker/package.json (stop relying on workspace hoist).

3) Centralize EventBus creation
   - Provide a shared helper in packages/realtime (e.g., createNodeEventBus()) that builds [Supabase | SocketHTTP | Multi] from env.
   - Replace bus construction in apps/api/src/trpc/init.ts and apps/worker/src/services/realtime-bus.ts.
   - Remove apps/api/src/lib/realtime.ts (duplicate broadcast helper).

4) Standardize channels in one place
   - Extend packages/realtime/src/channels.ts with team(), threadsTeam(), messagesTeam().
   - Refactor apps/realtime/src/index.ts and dashboard subscriptions to use these helpers (no literal strings like `team:${id}`).

### P2 (Quality/Perf)
5) Payload parity across transports
   - Ensure /events POST handler emits payloads matching packages/realtime supabase adapter (always include teamId/threadId; message or conversation payloads consistently).

6) Single realtime feed with fallback
   - RealtimeProvider: prefer Socket.IO; only subscribe to Supabase broadcast/PG changes when socket is unavailable.
   - use-realtime-messages: remove parallel duplicate subscriptions; keep dedupe by id as defense-in-depth.

### P3 (Ops/Cleanup)
7) Graceful shutdown
   - apps/worker/src/index.ts: handle SIGINT/SIGTERM to clear intervals, teardown sessions (Registry) cleanly.
   - apps/realtime/src/index.ts: close http + socket server on signals.

8) Prod hardening
   - Restrict CORS origins for realtime in production; align logging prettiness with NODE_ENV.

9) Code hygiene
   - Remove or clearly deprecate apps/worker/src/tasks/invoices/* (moved to Trigger.dev).
   - Implement counts.updated producer or drop the event type from packages/realtime/src/events.ts.

## Deliverables (PRs)
1) PR: Outbox locking + pg dep + tests (worker).
2) PR: EventBus helper + API/Worker refactor + remove duplicate broadcast helper.
3) PR: Channels standardization across server/UI.
4) PR: Socket.IO payload parity + UI single-feed fallback.
5) PR: Graceful shutdown, CORS/logging tweaks, and cleanup.

## Acceptance Criteria
- No duplicate sends/events when two worker instances run concurrently.
- Events delivered with consistent payloads across transports; dashboard handles them once.
- All typechecks/tests pass; no reliance on hoisted deps.
- Realtime server and worker exit cleanly on SIGINT/SIGTERM.

## Config/Env Notes
- REALTIME_URL and REALTIME_INTERNAL_TOKEN for Socket.IO HTTP bus.
- NEXT_PUBLIC_SUPABASE_URL, SUPABASE keys already in use.
- Optional REDIS_URL enables presence/locks backends.

## Validation
- Local e2e: run two worker processes; observe unique outbox claims and single deliveries.
- Verify UI receives one message.created/updated per event after single-feed change.
