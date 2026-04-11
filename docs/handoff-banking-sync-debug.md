# Banking Sync Debug Session - Handoff Document

## Goal
Complete Phase 1-2 banking architecture by fixing end-to-end banking sync flow with Trigger.dev. The sync triggers but doesn't update database records.

## What Was Fixed

### 1. Schema Mismatches
| Issue | Fix | File |
|-------|-----|------|
| `syncConnectionSchema` required `teamId` input | Removed - Midday derives from connection query | `packages/jobs/src/schema.ts` |
| `accountType: "depository"` hardcoded | Changed to use `account.type` from query | `packages/jobs/src/tasks/bank/sync/connection.ts` |
| Missing `error_retries` column in `bank_accounts` | Added `error_retries` and `error_details` columns | `packages/db/src/schema/financial.ts` |

### 2. Migration Generated & Applied
- `src/migrations/0002_mysterious_pride.sql` adds `error_retries` and `error_details` columns to `bank_accounts` table
- Successfully applied to database

### 3. Sync Task Updated
- `packages/jobs/src/tasks/bank/sync/connection.ts` now:
  - Selects `error_retries` column
  - Uses `account.type` instead of hardcoded `"depository"`
  - Simplified `.or()` filter to post-query JavaScript filter (avoid Supabase query complexity)

## Current Blocker

**Trigger.dev dev server can't connect to Supabase:**
```
Error: {"code":"42501","message":"permission denied for table bank_connections"}
```

### Root Cause
- The `SUPABASE_SECRET_KEY` (service role JWT) needs to be available to Trigger.dev background tasks
- Correct key format is provided: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Supabase service_role key)
- Added to `packages/jobs/.env` and `apps/worker/.env`

### What Midday Does (DO NOT DEVIATE)
1. Check `/home/louis/developer/faworra/midday/packages/jobs/` for:
   - How they run `trigger dev`
   - What env vars they load
   - Their `.env-template` shows: `DATABASE_PRIMARY_POOLER_URL`, `MIDDAY_ENCRYPTION_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`

2. Check `/home/louis/developer/faworra/midday/packages/supabase/src/client/job.ts`:
   - Uses `process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL`
   - Uses `process.env.SUPABASE_SECRET_KEY!`

3. Faworra MUST match Midday's pattern exactly

## Test Data IDs
- Connection: `b68b9e5a-328e-4040-b867-ade12e973914`
- Account: `61f368ef-46c0-4539-9d0e-71dd5b13d38c`
- Team: `a60096af-b3b8-40e6-b3d7-eb65c763622d`

## Test Endpoints
```bash
# Trigger banking sync
curl -X POST http://api.faworra.localhost:1355/test/sync-bank \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "b68b9e5a-328e-4040-b867-ade12e973914"}'

# Check banking data
curl -s http://api.faworra.localhost:1355/test/banking-data
```

## Env Vars Needed (from `apps/api/.env`)
```
SUPABASE_URL=https://nwhsdbihxxobasadahbq.supabase.co
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(service_role key - in Letta secrets as $KEY)
TRIGGER_PROJECT_ID=proj_ckpumcmqvhdswyywlqvp
TRIGGER_SECRET_KEY=tr_dev_gadPTk6PQDAKa08xfh33
DATABASE_URL=postgresql://postgres.nwhsdbihxxobasadahbq:XoBvB8M1CQmJGWLu@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

## Next Steps (FOLLOW MIDDAY-FIRST PRINCIPLE)

1. **Check Midday's env loading**: How does Midday's `packages/jobs` get `SUPABASE_URL` and `SUPABASE_SECRET_KEY`? They're not in `.env-template`.

2. **Check Midday's turbo.json**: How is `jobs:dev` configured? Does it inherit env from root?

3. **Match Faworra to Midday**: Copy Midday's exact pattern for how Trigger.dev jobs access Supabase.

4. **Run Trigger.dev dev server**: Start it the same way Midday does.

5. **Test sync**: Once Trigger.dev can connect to Supabase, verify `bank_connections.last_synced_at` and `bank_accounts.sync_status` update correctly.

## Key Files Changed
- `packages/db/src/schema/financial.ts` - added `error_retries`, `error_details` columns
- `packages/jobs/src/schema.ts` - removed `teamId` requirement from `syncConnectionSchema`
- `packages/jobs/src/tasks/bank/sync/connection.ts` - updated query, accountType mapping
- `packages/jobs/.env` - added `SUPABASE_SECRET_KEY`
- `apps/worker/.env` - added `SUPABASE_SECRET_KEY`

## Wiki/Reference Locations
- Midday wiki: `/home/louis/developer/faworra/faworra-new/midday-wiki/`
- Midday source: `/home/louis/developer/faworra/midday/`
- Local Mono docs: `docs/mono/` (91 pages scraped)
