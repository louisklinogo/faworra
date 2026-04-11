# Faworra Identity Reference

## Purpose of this document

This file exists so that any future contributor, designer, engineer, operator, or agent can quickly understand what Faworra is, what it is not, and what product and architecture boundaries should guide decisions.

This is not a speculative vision document. It is a practical interpretation of:

- `faworra-architecture-prompt.md`
- `faworra-monorepo-architecture.md`
- the current Midday-first architectural stance of this repository

If there is ambiguity between a clever idea and the product definition below, this document should win unless a newer intentional strategy document replaces it.

---

## One-sentence definition

**Faworra is a Midday-shaped, West Africa-focused Business OS that helps small and medium business owners run the business with less cognitive load by combining finance, operations, communications, documents, memory, and AI-assisted execution into one system.**

---

## The shortest useful mental model

Faworra is not just software that records what happened.

Faworra is meant to:

1. **observe** business activity,
2. **organize** it into structured records,
3. **reason** about what matters,
4. **act** on behalf of the owner where safe,
5. **ask for approval** where needed, and
6. **preserve business memory** so the company can operate beyond what the founder remembers.

Another way to say it:

- Midday gives much of the financial and architectural foundation.
- Faworra expands that foundation into a broader operating system for SMEs.
- The user should not have to stitch together five disconnected tools to run the company.

---

## Core mission

The core mission stated in the architecture prompt is:

> **Operate the business on behalf of the owner.**

That mission has real implications.

Faworra should reduce:

- cognitive overhead,
- follow-up burden,
- workflow leakage,
- operational inconsistency,
- business-memory loss,
- and the founder's dependence on manual coordination.

Faworra should increase:

- operational visibility,
- financial readiness,
- execution reliability,
- professionalism,
- recoverable knowledge,
- and the owner's ability to make higher-level decisions.

---

## Who Faworra is for

### Primary market

Faworra is being built first for the ff in the following order:

- **Ghana**, then more broadly
- **West Africa**
- **Africa**
- **Global**

### Primary user profile

Faworra is for:

- small and medium business owners,
- often time-constrained,
- often operating with limited systems,
- often coordinating customers, payments, and staff through WhatsApp,
- often lacking clean records, repeatable workflows, and decision support.

The product especially matters for founders who experience:

- executive dysfunction,
- operational overload,
- fragmented processes,
- and the constant feeling that the business only works if they personally remember everything.

### Business types

**Phase 1: Fashion focus.**

Faworra starts with a strong proof point in **fashion** — tailoring, alterations, and apparel businesses.

This is not a permanent niche. But the product will not generalize until fashion is validated:
- measurements workflow,
- order lifecycle,
- fitting appointments,
- fabric/material tracking,
- client relationship patterns for this industry.

**Phase 2+ expansion** will add:
- food/restaurants,
- retail,
- beauty/salons,
- other service businesses.

Industry configuration infrastructure will be built after 2-3 industries are validated deeply — not before.

---

## What Faworra is solving

The source prompt names the problems directly. These are not side quests. They define why the product exists.

Faworra is meant to solve for business owners who deal with:

1. cognitive overload,
2. awkward and inconsistent payment follow-up,
3. appointment and booking chaos,
4. weak visibility into whether the business is growing,
5. silent supplier price creep and margin erosion,
6. staff accountability without constant confrontation,
7. missing reviews and social proof,
8. business knowledge trapped in the founder's head,
9. weak digital presence and poor business infrastructure,
10. poor access to capital because records are missing,
11. ideas captured in Notion or elsewhere that never become action,
12. poor cash flow visibility,
13. untracked referral value and relationship intelligence.

This list matters because it defines the scope of the product. Faworra is not only about bookkeeping. It is about helping an SME operate coherently.

---

## What Faworra is

The architecture prompt defines Faworra as a combination of operating layers. These layers should be treated as pillars, not disconnected features.

### 1. Financial OS

Faworra is a financial operating layer.

That includes:

- bank sync via **Mono**,
- transactions,
- expenses,
- invoices and payment requests,
- cash flow visibility,
- cash flow projection,
- tax readiness,
- transaction categorization,
- P&L reporting,
- capital-readiness through clean financial records.

This is where Midday is the strongest architectural and product reference.

### 2. Client and Order OS

Faworra is also a client and execution system.

That includes:

- CRM,
- customer history,
- orders,
- appointments,
- referral relationships,
- client value and relationship scoring,
- payment follow-ups,
- customer lifecycle understanding.

This is a major expansion beyond Midday's lighter customer model.

### 3. Communications OS

Faworra is a communication layer, especially for markets where business is run through chat.

That includes:

- WhatsApp,
- Instagram messaging,
- a unified inbox,
- AI triage,
- autonomous or semi-autonomous responses,
- message templates,
- structured follow-up workflows,
- handoffs between automation and people.

This is not optional. It is central to the product's regional and operational fit.

### 4. Product and Inventory OS

Faworra is also responsible for the economics of what the business sells.

That includes:

- products,
- costing,
- supplier management,
- margin tracking,
- inventory and related operational context.

The point is not just to record sales. The point is to help the business understand whether it is making money.

### 5. Vault

Faworra includes a secure, AI-organized business document layer.

That includes:

- receipts,
- contracts,
- supplier invoices,
- order confirmations,
- tax documents,
- and other operational files.

The Vault is not just file storage. It should make documents:

- linked,
- findable,
- structured,
- AI-readable,
- and connected to transactions, orders, and workflows.

### 6. Founder's Brain

Faworra includes a memory and decision-support layer for the founder.

That includes:

- idea capture,
- business notes,
- planning support,
- operational memory,
- decision support,
- weekly AI business summaries,
- a system that helps turn ideas into action.

This is one of the clearest places where Faworra is broader than a financial tool.

### 7. Visibility Layer

Faworra includes a visibility and trust layer.

That includes:

- investor-facing dashboards,
- staff or agent views,
- shareable order and booking pages,
- reputation capture,
- review collection,
- business performance visibility.

This layer helps the owner, the team, and trusted outsiders understand what is happening without chasing the founder for context.

---

## What Faworra is not

This section is as important as the positive definition.

### Faworra is not just an accounting app

It includes finance, but it is not only:

- an expense tracker,
- an invoicing tool,
- a bookkeeping UI,
- or a reporting dashboard.

If a decision makes Faworra behave like a narrow finance product while ignoring communications, operations, and memory, that decision is probably wrong.

### Faworra is not just a CRM

It includes customer and relationship workflows, but it is not only:

- a contacts database,
- a sales pipeline,
- or a marketing automation layer.

The product must connect customers to money, orders, messages, and execution.

### Faworra is not a generic chatbot wrapper

AI is not present to make the product sound modern.

Faworra's AI is intended to be:

- operational,
- context-aware,
- team-scoped,
- tool-using,
- memory-backed,
- and constrained by policy.

It is **not** meant to be just a chat window with vague advice.

### Faworra is not a Notion clone

The founder's brain is not about reproducing generic notes software.

It is about turning:

- ideas,
- plans,
- observations,
- and business memory

into structured context and action.

### Faworra is not an internal-only admin dashboard

It must support internal operations, but the product also needs outward-facing utility:

- payment requests,
- booking and ordering surfaces,
- shareable pages,
- customer communications,
- investor or stakeholder visibility.

### Faworra is not “build every feature for every business”

It is generalized through **industry configuration**, not through undisciplined scope creep.

The product should adapt by industry while preserving a common platform.

### Faworra is not a fresh architecture experiment

This repository is explicitly Midday-first.

That means Faworra is not the place to invent new app/package boundaries, routing patterns, request-context patterns, or data-flow patterns when Midday already provides a proven one.

---

## The Midday relationship

Faworra is deeply informed by Midday, but it is not merely “Midday with a new logo.”

### What Midday gives Faworra

Midday provides a proven foundation for:

- finance,
- transactions,
- invoices,
- document handling,
- AI summaries,
- app/package boundaries,
- Next.js App Router data flow,
- Hono + tRPC backend patterns,
- Drizzle + Supabase architecture,
- worker and async patterns,
- team-scoped multi-tenancy.

### What Faworra adds or changes

Faworra extends that foundation into:

- communications,
- orders and appointments,
- referrals and relationship memory,
- supplier and product economics,
- founder-brain workflows,
- industry configuration,
- a more explicit AI operator model,
- a West Africa-specific delivery context,
- Mono rather than Midday's original banking-provider focus,
- Better Auth rather than Supabase Auth.

### The practical rule

If Midday already solves a problem cleanly, Faworra should start there.

If Faworra needs more than Midday offers, it should extend Midday's pattern rather than inventing a disconnected replacement.

---

## Delivery model

### Primary delivery surface

Faworra is web-first.

The main delivery surface is:

- **Next.js PWA**

This choice fits:

- the target market,
- installable app-like delivery,
- and the need to ship broadly without waiting for native platform distribution.

### Mobile strategy

Native mobile exists, but later.

- **Expo mobile app is Phase 2**

That means contributors should not act as if the mobile app is the first-class delivery constraint for every current decision.

### Regional reality

The product is being built for an Android-dominant market, while still serving iOS users.

That should influence:

- performance expectations,
- offline sensitivity,
- communication-first interactions,
- lightweight operational flows,
- and installable web behaviour.

---

## Industry configuration is a core product principle

Faworra is not a hard-coded tailoring app forever.

But **Phase 1 is fashion-optimized**. The product ships with:
- measurements storage and UI,
- fabric/material tracking,
- fitting appointments,
- fashion-specific order fields.

Industry configuration as a structural capability is **deferred to Phase 2**.

When the product validates across 2-3 industries (fashion, then likely beauty or food), the configuration layer will be extracted:
- business selects industry during onboarding,
- Faworra configures labels,
- workflows adjust,
- categories adjust,
- templates adjust,
- operational logic adjusts,
- communication scripts adjust,
- KPIs and summaries adjust.

Industry configuration will not be cosmetic. It will be a structural product capability — but built after real validation, not before.

---

## AI's role in Faworra

AI in Faworra should be treated as an **operator layer**, not a decorative assistant.

That means AI may:

- interpret inbound business communication,
- classify and route work,
- retrieve business memory,
- follow up on payments,
- summarise what changed,
- highlight anomalies,
- assist in planning,
- propose actions,
- schedule future actions,
- and sometimes execute actions through typed tools.

That also means AI should **not**:

- bypass domain package rules,
- write directly to the database outside approved boundaries,
- cross team boundaries,
- or take high-risk actions without approval when approval is required.

---

## What “operate the business” should mean in practice

When people say Faworra should operate the business, that should be interpreted carefully.

It does **not** mean uncontrolled automation.

It means the system should help move work forward by:

- capturing incoming activity,
- structuring it,
- keeping context attached,
- reminding the owner or staff,
- drafting the next message,
- generating the invoice,
- recording the transaction,
- surfacing the risk,
- and preserving memory.

The owner should spend less time remembering, chasing, and coordinating.
The owner should spend more time deciding.

---

## Product boundaries future contributors should respect

### 1. Finance is central, but not sufficient

If a contribution only improves accounting while ignoring surrounding workflows, it may help the stack but not the product mission.

### 2. Communications are a first-class operating surface

WhatsApp and adjacent channels are not bolt-ons. They are part of the business operating surface.

### 3. Documents must stay linked to business objects

Vault documents should not become an isolated file bucket. They should connect to:

- transactions,
- orders,
- suppliers,
- customers,
- and business workflows.

### 4. Team scope is non-negotiable

Everything meaningful in Faworra is team-scoped. This affects product logic, data access, AI retrieval, messaging, and external integrations.

### 5. The product must reduce cognitive load

If a feature adds more manual ceremony than it removes, it may be architecturally neat but strategically off-target.

### 6. Public-facing utility matters

Do not think only in terms of internal admin screens. Faworra also needs external business surfaces that customers, staff, or stakeholders can use.

### 7. Faworra should accumulate business memory

The system should preserve useful context so the business can function with more continuity over time.

---

## Architecture stance that follows from the product

The product definition implies several architectural truths.

### Faworra is Midday-first

Use Midday's:

- app boundaries,
- package boundaries,
- request-context patterns,
- RSC + tRPC data flow,
- team model,
- and shared-package discipline

unless Faworra has a concrete reason to adapt them.

### Faworra is package-driven, not app-spaghetti

Apps own surfaces.
Packages own reusable domain and infrastructure logic.

### Faworra is team-scoped by default

Multi-tenancy is not an afterthought.

### Faworra keeps Postgres as source of truth

Queues, workflows, and AI orchestration are execution layers, not replacements for the core business record.

### Faworra uses async execution because the product requires it

This product includes:

- reminders,
- message workflows,
- ingestion,
- OCR,
- AI orchestration,
- durable waits,
- rate-limited external APIs.

That means asynchronous infrastructure is not optional.

---

## Technologies that are part of the product identity

These are not random implementation choices. They reflect product and architecture commitments.

- **Next.js 15 App Router** for the primary product app and PWA experience
- **Hono + tRPC** for type-safe backend application APIs
- **Supabase Postgres** as the data platform
- **Drizzle** as ORM, especially because it fits RLS and the stack direction better than Prisma here
- **Mono** for banking connectivity in the target region
- **Kapso / WhatsApp Cloud API** for communications infrastructure
- **Trigger.dev** for durable workflows, with worker/queue strategy layered around operational needs
- **Better Auth** instead of Supabase Auth
- **Expo** for later mobile delivery

---

## What should usually be considered out of scope in the near term

Unless strategy changes, contributors should assume these are not first-wave priorities:

- desktop-first product thinking,
- building a separate desktop client as a core product surface,
- treating the website as the main application,
- inventing a brand new architecture when Midday already covers the need,
- overbuilding mobile-first flows before the PWA foundation is solid,
- building isolated niche features that do not connect to the Business OS mission,
- adding AI gimmicks with no operational utility,
- building industry-specific hard-coding that bypasses the industry-config model.

---

## If you are making decisions in this repo, optimise for these outcomes

Prefer decisions that make Faworra:

- easier for overwhelmed founders to use,
- more operationally coherent,
- more team-aware,
- more financially trustworthy,
- more communication-native,
- more context-rich,
- more automatable through typed domain logic,
- more aligned with Midday's proven structure,
- more capable of turning records into action.

Avoid decisions that make Faworra:

- just another admin panel,
- just another chatbot,
- just another bookkeeping app,
- dependent on founder memory,
- disconnected across modules,
- or architecturally clever but strategically unfocused.

---

## Practical summary for future contributors

If you only remember a few things, remember these:

1. **Faworra is a Business OS for SMEs, not a single-purpose tool.**
2. **It starts from Midday's architecture and extends it.**
3. **It is built first for Ghana and West Africa.**
4. **Phase 1 focus: Fashion (tailoring, alterations). Industry config comes later.**
5. **Finance matters, but communications, operations, documents, and memory matter too.**
6. **AI is meant to operate with context and policy, not just chat.**
7. **The product's job is to reduce cognitive load and move business work forward.**

If a proposed feature or implementation helps the system do those things, it is probably on-strategy.
If it pulls the product toward a narrow tool, a generic assistant, or a disconnected dashboard, it is probably off-strategy.
