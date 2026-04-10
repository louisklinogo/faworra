# Banking Integration - Session Handoff

## Current State: Phase 2 (Paused for Parity Fixes)

**Branch:** `feature/transactions-parity`
**Last commits:**
1. `fd22955` - feat: implement Phase 2 banking sync with Trigger.dev tasks
2. `b6550d4` - feat: wire Mono webhook to Trigger.dev tasks
3. `5f2c0a5` - fix: use batchTriggerAndWait with staggered delays for syncConnection

**TypeScript:** ✅ All checks pass

---

## Critical Deviation Identified

### The Problem: Using Drizzle for Banking Operations

**What Midday does:**
- Banking tasks use **Supabase client** (`createClient()` from `@midday/supabase/src/client/job.ts`)
- Document processing uses **Drizzle** (`getDb()` from `@midday/db/job-client.ts`)
- They use BOTH in different contexts

**What Faworra currently does:**
- All tasks use **Drizzle** directly
- No Supabase client package exists

**Why this is a deviation:**
The memory blocks say "Drizzle for ORM" but this was misunderstood. Midday uses:
- Supabase client for banking/API routes (PostgREST queries)
- Drizzle for document processing (complex SQL queries)

Supabase client ≠ Supabase Auth. Midday uses Better Auth for auth, but Supabase client for database queries.

---

## Files Currently Using Wrong Pattern

### packages/jobs/src/tasks/bank/sync/connection.ts
```typescript
// WRONG - current implementation
import { bankAccounts, bankConnections, db, eq, and } from "@faworra-new/db";

// SHOULD BE (Midday parity)
import { createClient } from "@faworra-new/supabase/job";

run: async ({ connectionId, teamId, manualSync }, { ctx }) => {
  const supabase = createClient();
  
  const { data } = await supabase
    .from("bank_connections")
    .select("provider, reference_id, team_id")
    .eq("id", connectionId)
    .single()
    .throwOnError();
  ...
}
```

### packages/jobs/src/tasks/bank/sync/account.ts
```typescript
// WRONG - current implementation
import { bankAccounts, transactions, db, eq } from "@faworra-new/db";

// SHOULD BE (Midday parity)
import { createClient } from "@faworra-new/supabase/job";
```

### apps/api/src/routes/mono.ts
```typescript
// WRONG - current implementation
import { db } from "@faworra-new/db";
import { getBankConnectionByEnrollmentId } from "@faworra-new/db/queries";

// SHOULD BE (Midday parity)
import { createClient } from "@faworra-new/supabase/job";
// Or use queries but with Supabase client, not Drizzle
```

---

## Implementation Plan to Fix

### Step 1: Create Supabase Client Package
```
packages/supabase/
├── src/
│   ├── client/
│   │   ├── job.ts      # For Trigger.dev tasks - COPY FROM MIDDAY
│   │   └── api.ts      # For API routes
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Reference:** `midday/packages/supabase/src/client/job.ts`
```typescript
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/db";

export const createClient = () =>
  createSupabaseClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
```

### Step 2: Generate Supabase Types
Need to run `supabase gen types` to get the Database type for Faworra schema.

### Step 3: Update Banking Tasks

**packages/jobs/src/tasks/bank/sync/connection.ts:**
- Import `createClient` from `@faworra-new/supabase/job`
- Use Supabase `.from()` queries instead of Drizzle
- Keep batchTriggerAndWait pattern (✅ correct)

**packages/jobs/src/tasks/bank/sync/account.ts:**
- Import `createClient` from `@faworra-new/supabase/job`
- Use Supabase for bank_accounts and transactions queries

### Step 4: Update API Webhook

**apps/api/src/routes/mono.ts:**
- Either use Supabase client directly (Midday pattern for webhooks)
- Or keep using Drizzle queries but document as accepted deviation

### Step 5: Keep Drizzle for Documents

The Drizzle setup in `packages/db/src/client.ts` and `packages/db/src/job-client.ts` should be kept for:
- Document processing tasks
- Complex queries needing full SQL control
- Migration management

---

## What's Already Correct (Keep)

1. ✅ Trigger.dev v4.4.3 with `schemaTask`
2. ✅ `batchTriggerAndWait` with staggered delays
3. ✅ Webhook event routing pattern
4. ✅ MonoProvider implementation
5. ✅ Transform functions for Mono API responses
6. ✅ Middleware pattern in `packages/jobs/src/init.ts`
7. ✅ Job schemas in `packages/jobs/src/schema.ts`
8. ✅ Database types and query functions in `packages/db/`

---

## Other Deviations to Document

| Area | Midday | Faworra | Status |
|------|--------|---------|--------|
| Provider | GoCardless, Plaid, Teller, EnableBanking | Mono | ✅ Deliberate (West Africa market) |
| DB Client (banking) | Supabase client | Drizzle | ❌ WRONG - fix needed |
| DB Client (docs) | Drizzle | Drizzle | ✅ Matches |
| Auth | Better Auth | Better Auth | ✅ Matches |

---

## Verification Checklist

Before continuing Phase 2, verify:
- [ ] Supabase client package created
- [ ] Supabase types generated
- [ ] Banking tasks use Supabase client
- [ ] Document tasks use Drizzle (already correct)
- [ ] TypeScript passes
- [ ] All tests pass

---

## Key Files to Reference

**Midday:**
- `midday/packages/supabase/src/client/job.ts` - Supabase job client
- `midday/packages/jobs/src/tasks/bank/sync/connection.ts` - Banking task with Supabase
- `midday/packages/jobs/src/tasks/bank/sync/account.ts` - Account sync with Supabase
- `midday/packages/db/src/job-client.ts` - Drizzle job client for docs
- `midday/packages/jobs/src/init.ts` - Trigger.dev middleware setup

**Faworra (to create/modify):**
- `packages/supabase/src/client/job.ts` - NEW
- `packages/jobs/src/tasks/bank/sync/connection.ts` - MODIFY
- `packages/jobs/src/tasks/bank/sync/account.ts` - MODIFY
- `apps/api/src/routes/mono.ts` - MODIFY

---

## Environment Variables Needed

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_service_role_key
DATABASE_URL=your_pooler_url
DATABASE_PRIMARY_POOLER_URL=your_pooler_url (for jobs)
```

---

## Resume Instructions

1. Read this file
2. Check Midday's `packages/supabase/src/client/job.ts`
3. Create Faworra equivalent
4. Update banking tasks to use Supabase client
5. Test TypeScript
6. Commit with deviation documentation
