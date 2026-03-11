## Faworra Monorepo Architecture

### Purpose

This document answers `faworra-architecture-prompt.md` using Midday as the architectural base and `faworra-master` as the domain reference. It keeps Midday's monorepo, App Router, Hono, tRPC, Drizzle, Supabase, and package-modularity patterns, while adapting the authentication layer to Better Auth for Faworra's business-operations product surface.

### Design stance

- Start from Midday's exact app and package structure.
- Preserve Midday's strong boundaries: apps own surfaces, packages own reusable domain and infrastructure logic.
- Use **Better Auth** as the auth provider while preserving Midday's request-context, middleware, and protected-route patterns.
- Keep Postgres as source of truth; queues and workflows are execution layers, not business state.
- Use a hybrid async model from day one: **BullMQ + Redis** for hot operational queues, **Trigger.dev** for durable orchestration and long-running waits.
- Treat AI as an operator layer across CRM, operations, finance, communications, and founder memory.

### Midday-first execution rule

- When implementation details are needed, check Midday's organization, patterns, and ownership boundaries first.
- Do not invent a new Faworra pattern if Midday already provides a proven one.
- Adapt only when Better Auth or a confirmed Faworra requirement makes a literal Midday copy incorrect.
- Ask for clarification only after the Midday reference has been checked and the path is still unclear.

### Explicit decision note

The original prompt named Trigger.dev as the background-job choice and explicitly avoided Redis. This document intentionally updates that one decision after comparing Faworra's hot-path messaging and operational workload shape with Midday's proven worker architecture. The revised position is:

- keep **Trigger.dev** as the durable orchestration layer,
- add **BullMQ + Redis** for queue-intensive operational execution,
- keep the rest of the architecture as close to Midday's app/package pattern as possible.

### Current scaffold and Phase 1 boundary

Phase 1 is about normalizing `faworra-new` toward the Midday-derived architecture without trying to build the entire business OS at once.

- `apps/dashboard` is the main authenticated product app scaffold.
- `apps/api` is the API app scaffold.
- `apps/mobile` is the mobile app scaffold.
- `apps/docs` is the current docs surface and can later be folded into a broader website app if needed.
- The immediate focus is app renaming, auth, middleware, request context, core multi-tenancy, schema separation, and local-dev ergonomics.
- Marketing website work, worker implementation, and most business-domain packages are intentionally saved for later phases.

## 1) Midday apps: keep, adapt, replace, or drop

| Midday app | Decision | Responsibility in Faworra | Reason |
|---|---|---|---|
| `apps/api` | **Adapted** | Owns Hono REST endpoints, tRPC routers, webhooks, public flows, MCP/tool endpoints, and orchestration entrypoints. | Midday's API boundary fits Faworra exactly, but Faworra adds Kapso, Mono, communications, founder-brain, and operator tools. |
| `apps/dashboard` | **Adapted** | Owns the authenticated Business OS PWA for founders and staff across finance, CRM, communications, operations, vault, and AI surfaces. | Midday's Next.js 15 + RSC + tRPC prefetch pattern is the right foundation, but Faworra needs broader operational modules. |
| `apps/desktop` | **Dropped** | No initial ownership. | Faworra is web-first and mobile-later for an Android-heavy market, so desktop is not a first-wave requirement. |
| `apps/website` | **Adapted** | Owns the public marketing site, SEO pages, docs, onboarding entry, and public acquisition flows. | Midday's split between product app and website still makes sense. |
| `apps/worker` | **Adapted** | Owns BullMQ workers, Redis-backed queue processing, queue admin visibility, and rate-controlled operational execution. | Midday already proves the worker pattern; Faworra should keep it for high-throughput operational work instead of forcing everything into workflow tooling. |

## 2) Midday packages: keep, adapt, replace, or drop

| Midday package | Decision | Responsibility in Faworra | Reason |
|---|---|---|---|
| `packages/accounting` | **Adapted** | Owns ledgers, categorization effects, cash flow, P&L, tax-readiness, margin, and capital-readiness calculations. | Midday's finance core is highly reusable, but Faworra needs SME cash control and operational margin visibility. |
| `packages/app-store` | **Adapted** | Owns connector metadata, install flows, provider capabilities, and future integration marketplace surfaces. | Midday's marketplace pattern is strong, but Faworra's key connectors are Kapso, Mono, Google, and later commerce/ops tools. |
| `packages/banking` | **Adapted** | Owns Mono connectivity, account linking, transaction sync, mobile-money normalization, and reconciliation inputs. | Same domain boundary, different regional providers and data nuances. |
| `packages/cache` | **Adapted** | Owns Redis-backed caching, rate limiting, dedupe windows, distributed locks, and shared queue connection primitives. | Faworra should provision Redis early so BullMQ and hot-path controls are first-class from the start. |
| `packages/categories` | **Adapted** | Owns system and team-defined financial, operational, and industry-aware categories. | Faworra needs categories beyond accounting, but Midday's package boundary is correct. |
| `packages/customers` | **Adapted** | Owns the Midday-style customer entity core used by invoices, payment history, and lightweight customer analytics. | Faworra keeps this proven core, but places richer relationship workflows in `packages/crm` instead of overloading the base customer package. |
| `packages/db` | **Adapted** | Owns Drizzle schema, migrations, RLS-aware query modules, and all typed persistence. | Midday's database boundary should remain the system backbone. |
| `packages/desktop-client` | **Dropped** | No initial ownership. | It only exists to support the dropped desktop app. |
| `packages/documents` | **Adapted** | Owns Vault ingestion, OCR, tagging, classification, linking, and retrieval for receipts, contracts, supplier invoices, and order files. | Midday's document processing is directly valuable, but Faworra links documents to more operational records. |
| `packages/email` | **Adapted** | Owns transactional email, fallback notifications, invites, summaries, and PDF delivery. | Email remains necessary, but it is not the primary customer-facing channel. |
| `packages/encryption` | **Kept as-is** | Owns encryption helpers for provider tokens, secrets, and stored credentials. | This boundary transfers directly from Midday. |
| `packages/events` | **Adapted** | Owns domain events, event outbox patterns, and internal event contracts used by queues, workflows, and audits. | Faworra needs events more broadly across communications and operations. |
| `packages/health` | **Kept as-is** | Owns health, readiness, and dependency probes for API and worker surfaces. | This is infrastructure, not product-specific logic. |
| `packages/import` | **Adapted** | Owns imports for transactions, contacts, products, historical orders, and onboarding backfills. | Faworra needs broader SME migration flows than Midday alone. |
| `packages/inbox` | **Adapted** | Owns financial/document ingestion from email and uploads: attachment capture, parsing kickoff, and document-to-transaction matching. | This preserves Midday's proven inbox pattern while keeping human conversation and channel workflows out of the inbox boundary. |
| `packages/insights` | **Adapted** | Owns weekly summaries, anomaly detection, growth signals, and founder-facing business brief generation. | Midday's insight engine is one of the strongest foundations to keep. |
| `packages/invoice` | **Adapted** | Owns invoice/payment request creation, PDFs, reminders, receivable state, and share links. | Midday's invoice package is reusable, with localization for West African payments and messaging follow-up. |
| `packages/job-client` | **Adapted** | Owns the runtime-agnostic async API, routing metadata, and idempotent dispatch helpers that send work to BullMQ or Trigger.dev without leaking runtime details into domain code. | This is the key seam that keeps Faworra scalable without rewriting domain logic later. |
| `packages/jobs` | **Adapted** | Owns Trigger.dev task definitions, schedules, durable orchestration flows, and shared workflow payload schemas. | This keeps Faworra aligned with Midday, where `packages/jobs` is the Trigger.dev workflow layer rather than the BullMQ runtime. |
| `packages/location` | **Adapted** | Owns timezone, locale, currency, phone normalization, and regional defaults for Ghana and West Africa. | Faworra's launch market makes localization more operationally important. |
| `packages/logger` | **Kept as-is** | Owns structured logging and trace-friendly logging primitives. | Midday's logger package transfers directly. |
| `packages/notifications` | **Adapted** | Owns in-app and email notifications for founders, staff, and system alerts. | Faworra keeps the notification pattern but adds operator and workflow-aware alerts. |
| `packages/plans` | **Adapted** | Owns subscription tiers, entitlements, feature gating, and usage controls. | Required unchanged in concept, but feature definitions differ. |
| `packages/supabase` | **Adapted** | Owns Supabase clients and helpers for Postgres, storage, and realtime integration, but not the primary auth/session provider. | Faworra still uses Supabase as the data platform, but Better Auth replaces Supabase Auth as the identity layer. |
| `packages/trpc` | **Kept as-is** | Owns shared tRPC contracts and helpers used across dashboard and API. | This is a direct architectural carry-over. |
| `packages/tsconfig` | **Kept as-is** | Owns shared TypeScript configuration presets. | Pure monorepo infrastructure. |
| `packages/ui` | **Adapted** | Owns the shared design system, forms, tables, inbox UI primitives, and responsive PWA components. | Midday's UI system is the right base, but Faworra needs operational and communications-heavy screens. |
| `packages/utils` | **Kept as-is** | Owns shared utilities, formatting, parsing, and common helpers. | Standard shared package boundary. |
| `packages/workbench` | **Adapted** | Owns the AI operator and founder-assistant interface shell, approval flows, and tool invocation surfaces. | Midday's workbench concept is excellent, but Faworra's operator must act across operations and communications, not only finance. |

## 3) Net-new apps and packages Faworra needs

### Net-new apps

| App | Responsibility | Why it is needed |
|---|---|---|
| `apps/mobile` | Owns the later Expo client for staff and founders using the same packages, auth, and API contracts as the PWA. | Mobile is already a confirmed Phase 2 decision and should fit the monorepo from the start. |

### Net-new packages

| Package | Responsibility | Why it is needed |
|---|---|---|
| `packages/crm` | Owns the relationship layer above `packages/customers`: leads, referrals, channel identities, lifecycle stages, relationship scoring, and customer memory. | Faworra's CRM scope is broader than Midday's `customers` package, but it should build on that proven customer core rather than duplicate it. |
| `packages/communications` | Owns human conversation systems: WhatsApp/Instagram threads, messages, templates, outbox logic, handoffs, and follow-up automation. | WhatsApp and Instagram are primary operating channels, so communications must be first-class and clearly separate from document-ingestion inbox flows. |
| `packages/auth` | Owns Better Auth configuration, session resolution, provider/account logic, and shared auth helpers for dashboard, API, and mobile clients. | Midday relies on Supabase Auth directly, but Faworra needs a dedicated package because Better Auth becomes a first-class architectural concern. |
| `packages/operations` | Owns orders, appointments, fulfillment states, measurements/specs, and execution tracking. | Faworra operates the business, so operations is a core domain. |
| `packages/catalog` | Owns products, variants, inventory, costing, supplier pricing, and margin inputs. | Product and supplier management are explicit pillars of the product. |
| `packages/industry-config` | Owns industry manifests that define labels, workflows, templates, default categories, KPIs, and prompt policy. | Industry configuration is a product principle, not a loose setting. |
| `packages/founder-brain` | Owns captured ideas, business notes, plans, decisions, and long-lived founder memory. | The founder's brain is a named product pillar and needs its own domain boundary. |
| `packages/ai-operator` | Owns prompt assembly, memory retrieval, policy, tool routing, and action planning for the autonomous operator. | AI is a first-class operator layer and should not be scattered across unrelated packages. |

## 4) Recommended final monorepo shape

### Apps

- `apps/api`
- `apps/dashboard`
- `apps/website`
- `apps/worker`
- `apps/mobile` *(Phase 2)*

### Product surface ownership

- `apps/dashboard` owns the authenticated founder workspace, staff/agent workspace, investor dashboard, and public product surfaces that depend on tenant state such as shareable invoices, booking/order pages, and review-capture flows.
- These public product surfaces should follow Midday's pattern of living inside the main app as explicitly allowed public route groups rather than being moved into the marketing site.
- `apps/website` owns marketing, SEO, documentation, pricing, and acquisition pages only; it does not own tenant-stateful product flows.

### Phase 1 app mapping for `faworra-new`

- `apps/dashboard` is the renamed product-app scaffold created in Phase 1.
- `apps/api` is the renamed API scaffold created in Phase 1.
- `apps/mobile` is the renamed mobile scaffold created in Phase 1.
- `apps/docs` stays in place during Phase 1 as the docs surface.
- `apps/worker` is part of the target architecture but is intentionally deferred until the async foundation phase.

### Shared packages

- Midday-derived and adapted: `accounting`, `app-store`, `banking`, `cache`, `categories`, `customers`, `db`, `documents`, `email`, `encryption`, `events`, `health`, `import`, `inbox`, `insights`, `invoice`, `job-client`, `jobs`, `location`, `logger`, `notifications`, `plans`, `supabase`, `trpc`, `tsconfig`, `ui`, `utils`, `workbench`
- Faworra net-new: `auth`, `crm`, `communications`, `operations`, `catalog`, `industry-config`, `founder-brain`, `ai-operator`

### Async runtime ownership

- `apps/worker` owns BullMQ queue registration, processors, retries, and queue admin surfaces.
- `packages/jobs` owns Trigger.dev tasks, schedules, and durable workflow orchestration.
- `packages/job-client` owns the domain-facing dispatch API that routes work to the correct runtime.
- `packages/cache` owns Redis primitives used by BullMQ and other hot-path coordination concerns.

### Realtime stance

- Faworra does **not** introduce a dedicated `apps/realtime` service initially.
- Live updates should follow Midday's proven pattern: Supabase Realtime subscriptions in the dashboard via `packages/supabase`, with API and worker processes publishing state changes through normal database writes and event flows.
- A dedicated realtime service is added only if chat presence, typing indicators, or high-frequency fan-out outgrow the Supabase-first approach.

### Better Auth + Midday pattern note

- Faworra keeps Midday's architectural pattern for middleware, request context, and protected procedures, but swaps the underlying auth provider from Supabase Auth to Better Auth.
- Dashboard middleware should still gate private routes, allow explicit public/share routes, and preserve `return_to` redirects.
- API and tRPC context should still resolve session and `teamId` early, then hand typed context to every procedure.
- `packages/auth` becomes the shared auth boundary, while `packages/supabase` remains the data-platform boundary.

### Portless local-dev stance

- Phase 1 local development should use Portless instead of hard-coded localhost ports.
- Preferred role-based names are `dashboard.faworra.localhost`, `api.faworra.localhost`, and `docs.faworra.localhost` routed through Portless's shared proxy port.
- Trusted origins, CORS, redirects, and local callback URLs should be written against those role-based names instead of numeric ports.

## 5) Data flow architecture for the core loop

### Core loop: WhatsApp order arrives -> tracked -> AI follows up for payment

1. A customer sends a WhatsApp message to the business account.
2. Kapso delivers the webhook to `apps/api`, which verifies the request and resolves the owning `team_id`.
3. `packages/communications` stores the inbound thread/message and links it to a person or lead via `packages/crm`.
4. `packages/events` writes a durable domain event and, where needed, an outbox row so execution is recoverable from Postgres.
5. `packages/job-client` classifies follow-up work by runtime:
   - **BullMQ / `apps/worker`** for hot-path jobs such as media download, message dispatch, OCR fan-out, provider throttling, and queue-heavy matching.
   - **Trigger.dev / `packages/jobs`** for durable orchestration such as payment reminder sequences, weekly summaries, long waits, and AI workflows.
6. `packages/ai-operator` loads the relevant team, industry, CRM, thread, order, and financial context and determines whether the message is an inquiry, quote, order, appointment, or payment event.
7. If the message creates work, `packages/operations` creates or updates the order or appointment, while `packages/catalog` supplies product/cost context and `packages/crm` updates relationship state.
8. If money is due, `packages/invoice` creates or updates the payment request and `packages/accounting` records the receivable implications.
9. `packages/communications` sends the next best response using a rule-based or operator-approved template grounded in `packages/industry-config`.
10. Trigger.dev schedules future reminders, review requests, or escalation steps; BullMQ handles any immediate outbound send queues and rate limits.
11. `apps/dashboard` prefetches the updated thread, order, client, and invoice state via tRPC; client components hydrate with `HydrateClient` and `useSuspenseQuery`.
12. When payment arrives through Mono sync or manual reconciliation, `packages/banking` and `packages/accounting` update truth in Postgres, and pending reminder workflows self-cancel after a fresh state check.

## 6) Multi-tenancy model

- Every tenant-owned table carries `team_id` and is protected by Supabase RLS.
- API sessions resolve the active team from authenticated membership, never from untrusted client input alone.
- Queue payloads and workflow payloads always include `teamId`, and package APIs require it explicitly for tenant-owned reads and writes.
- Workers and workflows may use elevated credentials, but they must call only team-scoped repository functions in `packages/db` and domain packages; raw unconstrained service-role queries are not allowed.
- Storage paths are team-scoped, for example `vault/{team_id}/...` and `communications/{team_id}/...`.
- External connections such as Kapso numbers, Mono accounts, and provider tokens are stored per team and encrypted at rest.
- Public flows use narrowly scoped public tokens or public IDs validated server-side against team-scoped records, never broad anonymous table access.
- AI retrieval, summaries, and tool actions are team-scoped by construction and cannot cross tenant boundaries without an explicit export flow.

## 7) Where industry configuration lives

- Industry configuration lives in `packages/industry-config`.
- Each manifest defines terminology, enabled modules, workflow states, default categories, field schemas, message templates, KPIs, and operator policy for an industry.
- `packages/db` stores the selected `industry_key` and version on team settings.
- `apps/api` loads the active manifest into request context.
- `apps/dashboard` uses it to render labels, navigation, forms, and workflow-specific UI.
- `packages/categories`, `packages/operations`, `packages/catalog`, and `packages/communications` consume it to seed defaults and validate industry-specific behavior.
- `packages/insights` and `packages/ai-operator` use it to compute the right summaries, thresholds, and recommended next actions.

## 8) AI operator architecture

### Inputs

The operator receives input from:

- WhatsApp and Instagram messages
- founder notes and brain dumps
- overdue invoices and unpaid balances
- new Mono transaction events
- supplier price changes
- order and appointment updates
- newly ingested vault documents

### Reasoning and action loop

1. `apps/api` or `apps/worker` emits a typed business event.
2. `packages/ai-operator` assembles context from `crm`, `communications`, `operations`, `catalog`, `invoice`, `accounting`, `documents`, and `founder-brain`.
3. Deterministic policy runs first for clear actions such as reminder timing, acknowledgment messages, and state transitions.
4. LLM reasoning is used where interpretation or summarization is needed, not where a rule already decides correctly.
5. The operator can only act through typed tools exposed by domain packages; it never writes directly to the database outside approved package functions.
6. High-risk actions can require founder/staff approval through `packages/workbench`.
7. Immediate hot-path work is handed to BullMQ; long waits and multi-step follow-ups are handed to Trigger.dev.
8. Every action is audited with actor type, source, team, correlation IDs, and affected records.

## 9) Async model and why both BullMQ and Trigger.dev exist

- **BullMQ + Redis** handle queue-intensive, high-throughput, or rate-sensitive operational work: webhook bursts, outbound message dispatch, OCR fan-out, media handling, provider sync bursts, event outbox draining, and hot retries.
- **Trigger.dev** handles durable orchestration: reminder sequences, weekly summaries, founder check-ins, scheduled follow-ups, human-in-the-loop waits, and long-running AI workflows.
- `packages/job-client` is the abstraction layer that hides the runtime choice from domain packages.
- `apps/worker` is the BullMQ runtime surface; `packages/jobs` remains the Trigger.dev workflow surface.
- `packages/cache` owns the Redis primitives shared by BullMQ and non-queue uses such as locks, rate limiting, and dedupe windows.
- Shared payload schemas follow Midday's ownership style: Trigger workflow schemas live in `packages/jobs`, BullMQ queue schemas live with `apps/worker`, and runtime-agnostic dispatch metadata lives in `packages/job-client` or the owning domain package.
- This split follows Midday's proven queue-worker model while making room for the workflow strengths of Trigger.dev.

## 10) Final recommendation

Faworra should be built as a Midday-shaped monorepo with `api`, `dashboard`, `website`, and `worker` as the initial app foundation; Supabase, Drizzle, tRPC, and RSC data flow preserved; inbox and customers **expanded rather than discarded**; and net-new packages added for communications, CRM, operations, catalog, industry configuration, founder memory, and the AI operator. The system should remain team-scoped at every layer, use Postgres as the source of truth, and adopt a hybrid async execution model so BullMQ/Redis and Trigger.dev each handle the job types they are best suited for.