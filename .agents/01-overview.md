# Overview

Faworra is a multi‑tenant SaaS that unifies communications (WhatsApp, Instagram, SMS) with business management (clients, orders, invoices, transactions), powered by AI assistance.

This guide is split into concise, modular files. Each section focuses on one topic you can read and apply quickly. Follow the server‑first, strong‑typing, team‑scoped, and performance‑minded principles throughout.

Core pillars:
- Server‑first data flow with Next.js Server Components and tRPC.
- Drizzle schema as the single source of truth with Supabase types regeneration.
- Team isolation: every query filtered by `team_id`; RLS enforced.
- Performance: indexes, keyset pagination, initialData pattern, virtualization.
- Security: server‑only secrets, short‑lived signed URLs, rate limits.
- Observability: structured logs and basic DB timings.

How to use this guide:
- Start with Architecture and Development Patterns to understand the data flow.
- Use UI/UX Parity to mirror established patterns (Midday reference).
- Consult Git Workflow, Testing, and Success Criteria before opening PRs.
- See Debugging and Quick Wins when you’re stuck.

References:
- Midday (production SaaS) for architecture and UI patterns.
- Evolution API for WhatsApp/Baileys integration.

Keep changes small, typed, and tenant‑scoped. Favor reuse over reinvention.
