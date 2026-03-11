# Faworra Architecture Design Prompt

## Context

We are building **Faworra** — an all-in-one business operating system (Business OS) targeting small and medium business owners, starting with the West African (specifically Ghanaian) market. Faworra is a SaaS platform designed to radically reduce the cognitive load of running a business, so that founders — including those with executive dysfunction, time scarcity (e.g., students running businesses), or operational knowledge gaps — only need to make high-level decisions, not manage workflows.

Faworra's core mission: **operate the business on behalf of the owner.**

---

## Problems Faworra Solves

1. Cognitive overload — founders can't keep up with daily operations
2. Chasing payments — awkward, manual, inconsistent follow-ups
3. No-shows and appointment chaos — bookings managed in notebooks and WhatsApp
4. Growth blindness — no sense of whether the business is actually progressing
5. Supplier price creep silently destroying margins
6. Staff accountability without confrontation
7. No reviews or social proof being captured
8. Business knowledge locked in the founder's head — no operational memory
9. No professional digital presence — no business WhatsApp, no invoices, no storefront
10. No access to capital due to no financial records
11. Ideas and plans that never get executed — founders use Notion but nothing acts on their ideas
12. No cash flow visibility — can't distinguish profitable from liquid
13. Client referral relationships not tracked or valued

---

## What Faworra Is

- **Financial OS** — bank sync (Mono), invoices, expenses, cash flow projections, tax readiness, transaction categorization, P&L reporting
- **Client & Order OS** — CRM, orders, appointments, referral graph, LTV scoring, payment follow-ups
- **Communications OS** — WhatsApp/Instagram unified inbox, AI triage, autonomous responses, message templates
- **Product & Inventory OS** — products, costing, supplier management, margin tracking
- **Vault** — secure, AI-organized document store: receipts, contracts, supplier invoices, order confirmations, tax documents — automatically tagged and always findable; linked to transactions and orders
- **Founder's Brain** — idea capture, AI planning, decision support, operational memory, weekly AI business summary
- **Visibility Layer** — investor dashboard, staff/agent view, shareable order/booking page, reputation capture

---

## Target Market

- **Primary:** Ghana and West Africa — Android-dominant (72%), iOS at ~28%
- **Business types:** tailoring, food, retail, beauty, services, and more — generalized via industry configuration
- **Delivery surface:** Next.js PWA (web-first, installable), with Expo mobile app in Phase 2

---

## Industry Configuration Model

At onboarding, a business selects their industry. Faworra dynamically configures data models, UI terminology, workflow templates, default financial categories, and communication scripts for that industry. Tailoring is the first validated industry template and proof of concept.

---

## Reference Codebases

### 1. Midday (`midday/` in this workspace)
Open-source financial OS for freelancers and small businesses. The full repository knowledge is documented in `C:\Developer\faworra\.qoder\repowiki`.

We are building **on top of** Midday's architecture — not reinventing what they have already solved.

**Midday's complete feature set** (what already exists and must be accounted for):

| Feature | Description |
|---|---|
| **Bank sync** | Plaid (US) + GoCardless (EU/UK) bank account connectivity, transaction sync |
| **Transactions** | Transaction list, categorization, enrichment, search, CSV export |
| **Invoicing** | Invoice creation, PDF generation, templates, recurring invoices, payment tracking |
| **Time tracking** | Live project time tracking, billable hours, project overviews |
| **Magic Inbox** | Gmail + Outlook OAuth sync — pulls PDF attachments, auto-matches to transactions |
| **Vault** | Supabase Storage-backed document store — upload, AI classification, tag extraction, HEIC conversion, document-to-transaction linking, MCP-accessible |
| **Insights** | AI-generated weekly/monthly/quarterly/yearly business summaries — metric selection, anomaly detection (low runway, negative profit, overdue invoices), AI narrative generation |
| **AI Assistant (Workbench)** | Chat-based AI agent with tool-calling across financial data — transactions, documents, customers, invoices |
| **MCP Server** | Model Context Protocol tools exposed via API — documents, transactions, customers, invoices, time entries |
| **App Store** | Integration marketplace: Slack, Gmail, Outlook, Stripe, QuickBooks, Xero, Fortnox, Cal.com, Google Drive, Dropbox, Zapier, Make, Polar, Deel, Raycast, WhatsApp + MCP connectors for Claude, ChatGPT, Cursor, Copilot, n8n, and more |
| **Customers (CRM)** | Customer management, analytics (most active, inactive count) |
| **Import** | CSV and bank statement bulk import |
| **Plans** | Subscription tier definitions and feature gating |
| **Multi-tenancy** | Full team isolation via `team_id` on all tables + Supabase RLS |
| **Auth** | Supabase Auth — OAuth, magic links, session management |
| **Encryption** | Encrypted credential storage for OAuth tokens and API keys |
| **Notifications** | Email + in-app notification system |
| **Desktop app** | Tauri cross-platform desktop client |

**Architectural foundations Midday provides:**
- Monorepo with Turborepo + Bun
- Next.js 15 App Router with Server Components + tRPC prefetch pattern (`HydrateClient`, `batchPrefetch`, `useSuspenseQuery`)
- Hono backend with tRPC routers + REST webhooks
- Drizzle ORM with Supabase Postgres
- BullMQ background job processing (worker app)
- shadcn-based UI component library (`@midday/ui`)
- Structured logging, health checks, event bus

### 2. faworra-master (`c:\Developer\faworra\faworra-master`)
Our initial implementation attempt. Contains:
- Domain-specific schema (clients, orders, measurements, communication threads, products)
- Business logic and RLS policies
- Agent documentation (`.agents/` directory)
- Early WhatsApp/Instagram integration work

This is a reference for Faworra's domain logic, not a base to build on.

---

## Confirmed Technology Decisions

| Concern | Decision | Reason |
|---|---|---|
| Frontend | Next.js 15 (App Router, Server Components, PWA) | Midday-proven, excellent DX, PWA-capable |
| Backend API | Hono + tRPC | Same as Midday — lightweight, type-safe, edge-compatible |
| Database | Supabase (Postgres) | Auth + Storage + Realtime + RLS + Africa region |
| ORM | Drizzle | Performance, edge compatibility, RLS compatibility (Prisma breaks RLS) |
| Background Jobs | Trigger.dev | Durable, long-running AI workflows, per-tenant dynamic scheduling, no Redis |
| WhatsApp | Kapso (`@kapso/whatsapp-cloud-api`) | Official Meta Cloud API, multi-tenant setup links, WhatsApp Flows, templates |
| Banking | Mono | West African bank connectivity + mobile money (MTN MoMo, Vodafone Cash, AirtelTigo) |
| Monorepo | Turborepo + Bun | Same as Midday |
| Mobile (Phase 2) | Expo (React Native) | iOS + Android from one codebase |

---

## Key Architectural Principles (from Midday)

- Server Components prefetch via tRPC → `HydrateClient` → Client Components use `useSuspenseQuery` — no prop drilling
- Multi-tenancy via `team_id` on all tables, enforced by Supabase RLS
- Shared packages for all reusable logic — extreme modularity
- Background jobs are async, durable, and per-tenant
- AI is a first-class citizen — not a chatbot, but an operator layer

---

## Prompt

You are a senior software architect. Using everything above as context, design the ideal monorepo architecture for Faworra.

Your design must:

1. **Start from Midday's exact package and app structure** as the foundation. Identify every Midday package and app, state whether it is kept as-is, adapted, replaced, or dropped for Faworra — with a clear reason for each decision.

2. **Identify net-new packages and apps** that Faworra needs beyond what Midday provides, driven strictly by the problems and pillars described above.

3. **Define the responsibility of every package and app** — one clear sentence per entry describing what it owns.

4. **Define the data flow architecture** — how the dashboard, API, worker, and packages interact end-to-end for the core loop: a business owner receives a WhatsApp order → it is tracked → the AI follows up for payment.

5. **Define the multi-tenancy model** — how team isolation is enforced across the stack.

6. **Define where industry configuration lives** and how it plugs into the rest of the system.

7. **Define the AI operator architecture** — how it receives input (WhatsApp messages, founder's brain dumps), reasons, acts, and schedules follow-ups.

8. Do not include provisional or placeholder decisions. Every recommendation must be justified by the context above or by established production patterns from Midday's codebase.
