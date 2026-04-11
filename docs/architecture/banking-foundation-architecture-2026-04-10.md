# Banking Foundation Architecture Analysis

**Date:** April 10, 2026
**Prepared by:** Letta (Agent: Faworra)
**Status:** Architecture Review & Implementation Plan

---

## Executive Summary

Faworra's banking integration has a **critical architectural deviation** from Midday's proven patterns. This document analyzes the deviation, provides the correct architecture, and outlines the implementation plan to achieve Midday parity.

### The Core Issue

**What we misunderstood:** "Drizzle for ORM, RLS-compatible" led us to use Drizzle for ALL database operations.

**What Midday actually does:** Uses BOTH Supabase client (for banking) and Drizzle (for documents), but in different contexts.

---

## Current Architecture Analysis

### What We Did Right ✅

1. **Trigger.dev Integration**
   - `schemaTask` pattern for type-safe task definitions
   - `batchTriggerAndWait` with staggered delays for rate limit avoidance
   - Proper middleware setup in `packages/jobs/src/init.ts`

2. **Webhook Pattern**
   - Event routing to Trigger.dev tasks (matches Midday's Plaid webhook pattern)
   - Proper event handling: `account_connected`, `account_updated`, `account_removed`, `data_available`

3. **Mono Provider**
   - Correct abstraction for West African market (deliberate deviation from Plaid/GoCardless)
   - Transform functions for Mono API responses
   - `packages/banking/src/interface.ts` provides clean abstraction

4. **Database Schema**
   - Domain-separated schema files (`auth.ts`, `core.ts`, `financial.ts`, `team.ts`)
   - Correct multi-tenancy with `team_id` on all tables
   - Better Auth integration (matches Midday pattern)

5. **Better Auth**
   - Correct choice - Midday also uses Better Auth (not Supabase Auth)
   - Session → userId → activeTeam → membership resolution

### What We Did Wrong ❌

| Area | Midday Pattern | Faworra (Current) | Impact |
|------|----------------|-------------------|--------|
| **Banking tasks** | Supabase client (PostgREST) | Drizzle queries | Missing RLS bypass, wrong query syntax |
| **Banking API routes** | Supabase client or query functions with Supabase | Drizzle queries directly | Same as above |
| **Supabase package** | `@midday/supabase` with job.ts, server.ts, client.ts | **Does not exist** | No way to follow pattern |
| **Database types** | Generated via `supabase gen types` | None | No type safety for PostgREST queries |
| **Job client for banking** | `createClient()` from `@midday/supabase/job` | `getDb()` from `@faworra-new/db` | Wrong tool for the job |

---

## The Midday Pattern (Source of Truth)

### Database Access Patterns in Midday

Midday uses **three different database access methods** for different purposes:

#### 1. Supabase Client - Job Context (Banking Operations)

**File:** `midday/packages/supabase/src/client/job.ts`

```typescript
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/db";

export const createClient = () =>
  createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!, // Service role key - bypasses RLS
  );
```

**Used for:**
- Banking sync tasks (`connection.ts`, `account.ts`)
- API route webhooks
- Any background job that needs full database access

**Query style:**
```typescript
const supabase = createClient();

const { data } = await supabase
  .from("bank_connections")
  .select("provider, access_token, reference_id, team_id")
  .eq("id", connectionId)
  .single()
  .throwOnError();
```

#### 2. Drizzle ORM - Job Context (Document Processing)

**File:** `midday/packages/db/src/job-client.ts`

```typescript
export const createJobDb = () => {
  const jobPool = new Pool({
    connectionString: process.env.DATABASE_PRIMARY_POOLER_URL!,
    max: 1, // Single connection per job
    idleTimeoutMillis: isDevelopment ? 5000 : 60000,
  });

  const db = drizzle(jobPool, { schema, casing: "snake_case" });

  return { db, disconnect: () => jobPool.end() };
};
```

**Used for:**
- Document processing tasks
- Complex SQL queries needing full control
- Bulk operations with specific performance requirements

#### 3. Supabase Client - Server Context (Dashboard/API)

**File:** `midday/packages/supabase/src/client/server.ts`

```typescript
export async function createClient(options?: CreateClientOptions) {
  const cookieStore = await cookies();

  const key = admin
    ? process.env.SUPABASE_SECRET_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  // Uses SSR package for cookie-based auth
  return createServerClient<Database>(/* ... */);
}
```

**Used for:**
- Next.js server components
- Authenticated API routes
- Dashboard data fetching (with RLS enforcement)

---

## The Architecture Fix

### Step 1: Create `packages/supabase/`

**Structure:**
```
packages/supabase/
├── src/
│   ├── client/
│   │   ├── job.ts         # COPY FROM MIDDAY - service role client for Trigger.dev
│   │   ├── server.ts      # Future: API routes with session context
│   │   └── browser.ts     # Future: Dashboard client
│   ├── types/
│   │   ├── db.ts          # Generated via `supabase gen types`
│   │   └── index.ts
│   ├── queries/           # Optional: Reusable Supabase queries
│   ├── mutations/         # Optional: Reusable Supabase mutations
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

**package.json:**
```json
{
  "name": "@faworra-new/supabase",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "db:generate": "supabase gen types --lang=typescript --project-id $PROJECT_ID --schema public > src/types/db.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.101.1",
    "@supabase/ssr": "^0.10.0"
  },
  "exports": {
    "./job": "./src/client/job.ts",
    "./server": "./src/client/server.ts",
    "./types": "./src/types/index.ts"
  }
}
```

### Step 2: Job Client Implementation

**File:** `packages/supabase/src/client/job.ts`

```typescript
/**
 * Supabase client for Trigger.dev background jobs
 * Midday parity: exact copy of midday/packages/supabase/src/client/job.ts
 *
 * Uses service role key (SUPABASE_SECRET_KEY) to bypass RLS
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/db";

export const createClient = () =>
  createSupabaseClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
```

**Why service role key?**
- Background jobs need full database access bypassing RLS
- Trigger.dev tasks run without user session context
- Same pattern in Midday for all banking/document tasks

### Step 3: Update Banking Tasks

**File:** `packages/jobs/src/tasks/bank/sync/connection.ts`

**Before (WRONG):**
```typescript
import { bankAccounts, bankConnections, eq, and } from "@faworra-new/db";
import { getDb } from "./../../../init";

run: async ({ connectionId, teamId, manualSync }, { ctx }) => {
  const db = getDb();

  const [connection] = await db
    .select()
    .from(bankConnections)
    .where(eq(bankConnections.id, connectionId))
    .limit(1);
  // ...
}
```

**After (CORRECT - Midday parity):**
```typescript
import { createClient } from "@faworra-new/supabase/job";

run: async ({ connectionId, teamId, manualSync }, { ctx }) => {
  const supabase = createClient();

  const { data } = await supabase
    .from("bank_connections")
    .select("provider, access_token, reference_id, team_id")
    .eq("id", connectionId)
    .single()
    .throwOnError();

  if (!data) {
    logger.error("Connection not found");
    throw new Error("Connection not found");
  }
  // ...
}
```

### Step 4: Update API Webhook

**File:** `apps/api/src/routes/mono.ts`

**Before (WRONG):**
```typescript
import { db } from "@faworra-new/db";
import { getBankConnectionByEnrollmentId } from "@faworra-new/db/queries";

const connectionData = await getBankConnectionByEnrollmentId(db, {
  enrollmentId: accountId,
});
```

**After (CORRECT - Option A, Supabase client directly):**
```typescript
import { createClient } from "@faworra-new/supabase/job";

const supabase = createClient();

const { data: connectionData } = await supabase
  .from("bank_connections")
  .select("id, team_id, provider")
  .eq("enrollment_id", accountId)
  .single()
  .throwOnError();
```

**After (CORRECT - Option B, keep query function but refactor):**
```typescript
// Option B: Keep query function but refactor to use Supabase client internally
// This requires updating packages/db/src/queries/bank-connections.ts
import { getBankConnectionByEnrollmentId } from "@faworra-new/supabase/queries";

const connectionData = await getBankConnectionByEnrollmentId({ enrollmentId: accountId });
```

### Step 5: Keep Drizzle for Document Processing (future)

**The `@faworra-new/db` package needs refactoring:**

1. Keep Drizzle for:
   - Schema definitions (`src/schema/`)
   - Complex document processing queries (future)
   - Migration management (`drizzle-orm`)

2. Create new exports:
   - `@faworra-new/db` → Drizzle (for documents)
   - `@faworra-new/supabase` → Supabase client (for banking)

**File:** `packages/db/src/client.ts`

```typescript
/**
 * Drizzle ORM client for document processing
 * Midday parity: createJobDb pattern from midday/packages/db/src/job-client.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Creates a job-optimized Drizzle instance for document processing
 * - Single connection per job (max: 1) to avoid flooding pooler
 * - Separate disconnect function for lifecycle management
 */
export const createJobDb = () => {
  const jobPool = new Pool({
    connectionString: process.env.DATABASE_PRIMARY_POOLER_URL!,
    max: 1,
    idleTimeoutMillis: isDevelopment ? 5000 : 60000,
    connectionTimeoutMillis: 15000,
    maxUses: 0,
    allowExitOnIdle: true,
  });

  const db = drizzle(jobPool, {
    schema,
    casing: "snake_case",
  });

  return {
    db,
    disconnect: () => jobPool.end(),
  };
};
```

---

## Environment Variables Required

```bash
# Supabase connection (for banking operations)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_service_role_key  # Service role for background jobs - bypasses RLS

# Drizzle connection (for document processing)
DATABASE_URL=your_pooler_url  # Read replica for queries
DATABASE_PRIMARY_POOLER_URL=your_pooler_url  # Primary for writes
```

---

## Migration Path

### Phase 1: Create Infrastructure (Day 1)
1. ✅ Create `packages/supabase/`
2. ✅ Copy `job.ts` from Midday
3. ✅ Set up `tsconfig.json` and `package.json`
4. ⏳ Generate `Database` types via `supabase gen types`
5. ⏳ Add environment variables

### Phase 2: Update Banking Tasks (Day 1-2)
1. ⏳ Update `packages/jobs/src/tasks/bank/sync/connection.ts`
2. ⏳ Update `packages/jobs/src/tasks/bank/sync/account.ts`
3. ⏳ Test TypeScript compilation
4. ⏳ Test Trigger.dev task execution

### Phase 3: Update API Routes (Day 2)
1. ⏳ Update `apps/api/src/routes/mono.ts`
2. ⏳ Optionally create Supabase query/mutation functions
3. ⏳ Test webhook handling

### Phase 4: Verification (Day 2)
1. ⏳ Run TypeScript check: `bun run check-types`
2. ⏳ Run lint/format: `bun run fix`
3. ⏳ Test banking sync end-to-end
4. ⏳ Update documentation

### Phase 5: Commit & Document (Day 2)
1. ⏳ Update memory blocks with correct architecture
2. ⏳ Document deviations table
3. ⏳ Commit with message: `fix: achieve Midday parity for banking database access`

---

## Deviations Documentation

### Approved Deviations

| Area | Midday Pattern | Faworra Deviation | Status | Reason |
|------|----------------|-------------------|--------|--------|
| Banking Provider | Plaid + GoCardless | **Mono** | ✅ Approved | West African market - deliberate choice |
| Geography | US/EU/UK | **Ghana/West Africa** | ✅ Approved | Target market |
| Currency | USD/EUR/GBP | **GHS + others** | ✅ Approved | Local currency |
| Auth | Better Auth | **Better Auth** | ✅ Matches | Same implementation |

### Corrected Deviations

| Area | What We Did | What We Should Do | Status |
|------|-------------|-------------------|--------|
| DB Client (banking) | Drizzle everywhere | **Supabase client for banking, Drizzle for docs** | ⏳ Fix in progress |
| DB Types | None | **Generated via `supabase gen types`** | ⏳ Fix in progress |
| Job Client | `getDb()` from wrong package | **`createClient()` from `@faworra-new/supabase/job`** | ⏳ Fix in progress |

---

## Key Files to Reference

**Midday (source of truth):**
- `midday/packages/supabase/src/client/job.ts` ← COPY THIS
- `midday/packages/supabase/src/types/db.ts` ← Generate equivalent
- `midday/packages/db/src/job-client.ts` ← Already have, keep for docs
- `midday/packages/jobs/src/tasks/bank/sync/connection.ts` ← Reference implementation
- `midday/packages/jobs/src/tasks/bank/sync/account.ts` ← Reference implementation
- `midday/packages/supabase/package.json` ← Export structure

**Faworra (to create/modify):**
- `packages/supabase/src/client/job.ts` ← NEW
- `packages/supabase/src/types/db.ts` ← NEW
- `packages/jobs/src/tasks/bank/sync/connection.ts` ← MODIFY
- `packages/jobs/src/tasks/bank/sync/account.ts` ← MODIFY
- `apps/api/src/routes/mono.ts` ← MODIFY

---

## Success Criteria

- [ ] `packages/supabase/` exists with correct structure
- [ ] `Database` types generated
- [ ] Banking tasks use Supabase client
- [ ] API routes use Supabase client
- [ ] Drizzle kept for document processing
- [ ] TypeScript compilation passes
- [ ] Trigger.dev tasks execute successfully
- [ ] Memory blocks updated with correct architecture
- [ ] Git history shows clear progression

---

## Notes for Future Implementation

1. **Service Role Key Security**: The `SUPABASE_SECRET_KEY` must be kept secure and never exposed to client-side code. Only use in:
   - Trigger.dev background tasks
   - API route webhooks (server-only)
   - Internal tools

2. **RLS Bypass Context**: When using Supabase client with service role key, RLS is automatically bypassed. This is intentional for background jobs that need full access.

3. **Future Document Processing**: When implementing the Vault (document storage), use Drizzle job client pattern for complex queries. Keep this architecture in mind.

4. **Testing Strategy**: Before deploying to production, test:
   - Banking sync with real Mono webhooks
   - Transaction upsert with Supabase client
   - Error handling and retry logic
   - Connection pool behavior under load

---

**Next Steps**: Proceed to Phase 1 implementation - create `packages/supabase/` infrastructure.
