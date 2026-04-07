---
name: midday-reference
description: Comprehensive reference skill for navigating and understanding the Midday open-source financial OS codebase in the current Faworra workspace. Use `midday/` (WSL path: `/home/louis/developer/faworra/midday`) for source-code reference and `faworra-new/midday-wiki` for local Midday documentation lookups. Apply this whenever Midday is mentioned, when studying how a Midday feature works, when comparing architecture for Faworra, or when extracting patterns from Midday to use in Faworra. Covers package responsibilities, app structure, key files, architectural patterns, and where to find things.
---

# Midday Reference

Midday is an open-source financial OS for freelancers and small businesses. It is used as the primary reference architecture for Faworra.

**Codebase location:** `midday/` (current WSL path: `/home/louis/developer/faworra/midday`)
**Preferred local documentation copy:** `faworra-new/midday-wiki` (current WSL path: `/home/louis/developer/faworra/faworra-new/midday-wiki`)
**Fallback shared repowiki:** `.qoder/repowiki` at the workspace root (current WSL path: `/home/louis/developer/faworra/.qoder/repowiki`)

The local `midday-wiki` copy contains the Midday documentation needed for Faworra work. Use it first for doc lookups. Fall back to the workspace `.qoder/repowiki` copy only if needed. This skill is the navigation layer — use it to locate the right doc or codebase file quickly.

---

## Repo Structure at a Glance

```
midday/
├── apps/
│   ├── api/          # Hono backend — REST + tRPC routers
│   ├── dashboard/    # Next.js 15 — main frontend (App Router)
│   ├── desktop/      # Tauri — cross-platform desktop app
│   ├── website/      # Next.js — marketing site
│   └── worker/       # BullMQ — background job processors
└── packages/
    ├── accounting/   ├── app-store/   ├── banking/     ├── cache/
    ├── categories/   ├── customers/   ├── db/          ├── desktop-client/
    ├── documents/    ├── email/       ├── encryption/  ├── events/
    ├── health/       ├── import/      ├── inbox/       ├── insights/
    ├── invoice/      ├── job-client/  ├── jobs/        ├── location/
    ├── logger/       ├── notifications/ ├── plans/    ├── supabase/
    ├── trpc/         ├── tsconfig/   ├── ui/          ├── utils/
    └── workbench/
```

---

## Apps

### `apps/api`
Hono-based HTTP server. Hosts tRPC routers, REST endpoints, MCP tools, and webhook handlers. Entry: `src/index.ts`.
- tRPC routers: `src/trpc/routers/`
- REST endpoints: `src/rest/`
- MCP tools: `src/mcp/tools/`
- Schemas (Zod): `src/schemas/`
- Auth middleware: `src/middleware/`

### `apps/dashboard`
Next.js 15 App Router frontend. Uses Server Components + tRPC prefetch pattern.
- Pages: `src/app/[locale]/(app)/`
- Components: `src/components/`
- tRPC client setup: `src/trpc/client.tsx`, `src/trpc/server.tsx`
- Hooks: `src/hooks/`
- Store (Zustand): `src/store/`
- Vault UI: `src/components/vault/`
- Inbox UI: `src/components/inbox/`
- AI assistant UI: `src/components/assistant/`

### `apps/worker`
BullMQ-based job processors. Runs async tasks triggered by jobs.
- Processors: `src/processors/`
  - `documents/` — AI classification, HEIC conversion
  - `transactions/` — enrichment, attachment processing
  - `inbox/` — email attachment sync
- Schedulers: `src/schedulers/`

### `apps/website`
Next.js marketing site. Docs live at `src/app/docs/content/` as MDX files.

### `apps/desktop`
Tauri (Rust + React) desktop app. Not relevant for Faworra initially.

---

## Packages

### Infrastructure

| Package | Responsibility | Key entry |
|---|---|---|
| `db` | Drizzle schema, migrations, all query functions | `src/schema.ts`, `src/queries/` |
| `supabase` | Supabase browser/server clients, auth helpers | `src/client/browser.ts`, `src/client/server.ts` |
| `cache` | Upstash Redis cache wrapper | `src/index.ts` |
| `encryption` | Encrypt/decrypt sensitive data (OAuth tokens, credentials) | `src/index.ts` |
| `events` | Internal event bus for cross-package side effects | `src/index.ts` |
| `logger` | Structured logging (Axiom) | `src/index.ts` |
| `health` | Service health check endpoints | `src/index.ts` |
| `trpc` | Shared tRPC type exports, context types | `src/index.ts` |
| `tsconfig` | Shared TypeScript config presets | `*.json` files |
| `utils` | Shared utility functions | `src/index.ts` |
| `location` | IP-based location lookup | `src/index.ts` |

### Business Domain

| Package | Responsibility | Key entry |
|---|---|---|
| `accounting` | P&L, burn rate, runway, cash flow calculations | `src/index.ts` |
| `banking` | Plaid + GoCardless bank connectivity, transaction sync | `src/providers/` |
| `categories` | Transaction category definitions and matching | `src/index.ts` |
| `customers` | Customer domain logic (CRM layer) | `src/index.ts` |
| `documents` | Document processing client (AI classification, tag extraction) | `src/index.ts` |
| `import` | CSV/bank statement import and parsing | `src/index.ts` |
| `inbox` | Gmail + Outlook OAuth, PDF attachment sync | `src/connector.ts` |
| `insights` | AI-powered business insights: metrics, anomaly detection, narrative | `src/index.ts` |
| `invoice` | Invoice generation, PDF rendering, templates | `src/index.ts` |
| `notifications` | Email + in-app notification templates | `src/index.ts` |
| `plans` | Subscription plan definitions and feature gates | `src/index.ts` |
| `email` | Transactional email sending (React Email) | `src/index.ts` |

### Jobs

| Package | Responsibility |
|---|---|
| `jobs` | BullMQ job definitions (what jobs exist, their payloads) |
| `job-client` | Client for triggering jobs from other packages/apps |

### UI & AI

| Package | Responsibility |
|---|---|
| `ui` | Shared shadcn-based React component library |
| `workbench` | AI assistant UI — chat interface, tool rendering, streaming |
| `app-store` | Integration connectors: Slack, Gmail, Stripe, QuickBooks, Xero, Cal.com, WhatsApp, MCP tools, and more |

---

## Critical Architectural Patterns

### 1. Server Components + tRPC Data Flow

The most important pattern to understand when studying Midday's dashboard.

```
Page (Server Component)
  → getQueryClient() — get cached query client
  → trpc.*.queryOptions() — build query options
  → queryClient.prefetchQuery() / fetchInfiniteQuery() — prefetch on server
  → <HydrateClient> — dehydrate state into HTML
      → <Suspense fallback={<Skeleton />}>
          → <ClientComponent /> — uses useSuspenseQuery(), data is instant
```

Key files:
- Server tRPC setup: `apps/dashboard/src/trpc/server.tsx` — defines `getQueryClient`, `HydrateClient`, `batchPrefetch`, `trpc` proxy
- Client tRPC setup: `apps/dashboard/src/trpc/client.tsx`
- Example page: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/customers/page.tsx`

### 2. Multi-Tenancy Model

- Every table has `team_id UUID NOT NULL`
- Supabase RLS enforces isolation: `team_id = ANY (private.get_teams_for_authenticated_user())`
- `private.get_teams_for_authenticated_user()` is a Postgres function in Supabase
- Service role bypasses RLS for background jobs
- Schema: `packages/db/src/schema.ts`

### 3. Vault (Document Storage)

- Supabase Storage bucket: `vault`
- Upload → `apps/dashboard/src/components/vault/vault-upload-zone.tsx`
- Processing job triggered → `apps/worker/src/processors/documents/process-document.ts`
- AI classification: title, summary, date, tags via `packages/documents`
- HEIC → JPEG conversion in worker
- Documents linked to transactions via `document_transaction_attachments` table
- MCP tool: `apps/api/src/mcp/tools/documents.ts`

### 4. AI Agent / MCP

- MCP server: `apps/api/src/mcp/`
- Tools registered per domain: `src/mcp/tools/documents.ts`, `transactions.ts`, `customers.ts`, etc.
- AI assistant UI (workbench): `packages/workbench/src/`
- Insights engine: `packages/insights/src/`

### 5. Background Jobs (BullMQ)

- Job definitions: `packages/jobs/src/`
- Job client (trigger from anywhere): `packages/job-client/src/`
- Processors (run the actual work): `apps/worker/src/processors/`
- Schedulers (cron-style): `apps/worker/src/schedulers/`

### 6. App Store / Integrations

- Each integration is a self-contained module: `packages/app-store/src/{integration-name}/`
- OAuth flow handled per integration
- Encrypted credentials stored via `packages/encryption`
- Notable: `whatsapp/` integration already exists in app-store

### 7. Inbox (Magic Inbox)

- Gmail + Outlook PDF sync: `packages/inbox/`
- Synced attachments matched to transactions automatically
- Worker processor: `apps/worker/src/processors/inbox/`

### 8. Banking

- Providers: Plaid (US), GoCardless (EU/UK)
- Provider abstraction: `packages/banking/src/providers/`
- Transaction sync runs as background job
- **For Faworra:** swap providers with Mono (West Africa)

---

## Repowiki Navigation

When you need deep knowledge on a topic, go directly to the repowiki:

| Topic | Repowiki path |
|---|---|
| Architecture overview | `Architecture Overview/Architecture Overview.md` |
| Data flow | `Architecture Overview/Data Flow Architecture.md` |
| Component relationships | `Architecture Overview/Component Relationships.md` |
| All shared packages | `Shared Packages/Shared Packages.md` |
| Database layer | `Shared Packages/Database Layer (@midday_db).md` |
| Banking integration | `Shared Packages/Banking Integration (@midday_banking).md` |
| Document management | `Shared Packages/Document Management (@midday_documents).md` |
| Invoice processing | `Shared Packages/Invoice Processing (@midday_invoice).md` |
| Accounting logic | `Shared Packages/Accounting Logic (@midday_accounting).md` |
| Job scheduling | `Shared Packages/Job Scheduling (@midday_jobs).md` |
| UI components | `Shared Packages/UI Components (@midday_ui).md` |
| API app | `Core Applications/API Application/` |
| Dashboard app | `Core Applications/Dashboard Application/` |
| Worker app | `Core Applications/Worker Application/` |
| AI/ML integration | `AI_ML Integration/` |
| Business features | `Business Features/` |
| Deployment | `Deployment & Operations/` |

All documentation paths in this skill are relative to: `faworra-new/midday-wiki/en/content/` by default. If a file is missing there, fall back to `.qoder/repowiki/en/content/` in the workspace root.

---

## How to Use This Skill

**"How does X work in Midday?"**
→ Check `faworra-new/midday-wiki` using the path table above first. If not found, fall back to `.qoder/repowiki`, then search the workspace code copy under `midday/`.

**"Where is X implemented?"**
→ Use the apps and packages tables above to identify the likely location, then `read_file` or `search_symbol` to drill in.

**"Can we use Midday's X for Faworra?"**
→ Locate it in Midday, understand its dependencies, then assess what needs to change (provider swap, naming, schema extension, etc.).

**"What pattern does Midday use for X?"**
→ Refer to the Critical Architectural Patterns section above. For deeper detail, go to the repowiki Data Flow or Architecture Overview docs.
