# Faworra Audit: Transactions + Banking + Finance

**Date:** 2026-04-07  
**Purpose:** Audit of Faworra's transactions, banking, and financial features against Midday wiki patterns

---

## 1. TRANSACTIONS (Implementation: **Good**)

### What's Implemented

| Area | Status | Location |
|------|--------|----------|
| Transaction schema | ✅ Complete | `packages/db/src/schema/financial.ts` |
| Categories (slug-based) | ✅ Complete | Same schema |
| CRUD operations | ✅ Complete | `packages/db/src/queries/transactions.ts` |
| List with filters | ✅ Complete | Same queries |
| Overview totals | ✅ Complete | `packages/db/src/queries/overview.ts` |
| tRPC router | ✅ Complete | `packages/api/src/routers/transactions.ts` |
| Create form UI | ✅ Working | `apps/dashboard/src/components/forms/transaction-create-form.tsx` |

### What's Missing

- ❌ **Attachments** - No `transaction_attachments` table or linking
- ❌ **Reconciliation status** - No `reconciled` state tracking
- ❌ **Merchant/counterparty** - No separate entity for payee details
- ❌ **Tags** - No tagging system beyond categories
- ❌ **Recurring transactions** - No recurrence patterns
- ❌ **Delete/soft-delete** - No delete mutation
- ❌ **End-to-end tests** - Only transition logic tests exist

### Gap from Wiki

The wiki describes attachments, reconciliation workflows, and merchant recognition. Faworra has the core transaction record but lacks the document attachment and reconciliation layers.

---

## 2. BANKING (Implementation: **Minimal** ⚠️)

### What's Implemented

| Component | Status | Location |
|-----------|--------|----------|
| Bank accounts schema | ✅ Complete | `packages/db/src/schema/financial.ts` |
| Bank connections schema | ✅ Complete | Same |
| List endpoint | ✅ Simple | `packages/api/src/routers/bank-accounts.ts` |
| Mobile Money type | ✅ Added | `momo` enum in schema |

### What's Missing

- ❌ **Provider facade** - No `@midday/banking` equivalent
- ❌ **Mono integration** - Zero provider code
- ❌ **Bank connection flow** - No UI for connecting banks
- ❌ **Transaction sync** - No import from bank feeds
- ❌ **Webhooks** - No Plaid/Teller/Mono webhook handlers
- ❌ **Institution management** - No bank/institution catalog

### Schema Gaps for Mono Integration

- No `providerId` on bank_connections
- No `externalProviderAccountId` on bank_accounts  
- No `balance` or `lastSyncedAt` fields
- No country/region metadata

---

## 3. OVERVIEW/FINANCIALS (Implementation: **Basic** ⚠️)

### What's Implemented

- Income/expense totals by summing signed amounts
- Transaction count

### What's Missing

- ❌ **Period filtering** - No date range selection for overview
- ❌ **Category breakdown** - No drill-down by category
- ❌ **Bank account breakdown** - No per-account totals
- ❌ **Cash flow projection** - No forward-looking estimates
- ❌ **P&L report** - No profit/loss computation
- ❌ **Tax readiness** - No tax category handling

---

## 4. Architecture Comparison: Midday vs Faworra

| Layer | Midday (Wiki) | Faworra | Gap |
|-------|---------------|---------|-----|
| **Banking Provider** | Plaid, Teller, GoCardless, Enable Banking | Nothing | Huge |
| **Transactions** | Full CRUD + attachments + reconciliation | CRUD only | Medium |
| **Categories** | Slug-based hierarchy | Slug-based, flat | Small |
| **Overview** | Period/category/account breakdowns | Simple totals | Medium |
| **Attachments** | Transaction-level attachments | None | Large |

---

## 5. Wiki Pattern: Provider Facade Architecture

From Midday's wiki, the banking architecture follows this pattern:

```
Provider Facade (index.ts)
    │
    ├── PlaidProvider → PlaidApi + transform.ts
    ├── TellerProvider → TellerApi + transform.ts
    ├── GoCardlessProvider → GoCardlessApi
    ├── EnableBankingProvider
    └── [MonoProvider] ← Needed for West Africa
```

To add Mono for West Africa, you need:
1. `MonoProvider` class implementing provider interface
2. `MonoApi` client for Mono's REST API
3. `MonoTransform` to normalize responses
4. Wire into Provider Facade
5. Add Mono credentials to env
6. Add webhook routes (if Mono supports them)

---

## 6. Priority Recommendations

| Priority | Item | Effort |
|----------|------|--------|
| **High** | Add attachments table and linking to transactions | Medium |
| **High** | Build Mono provider facade (following Midday's pattern) | High |
| **Medium** | Add bank connection UI flow | High |
| **Medium** | Add category hierarchy support | Low |
| **Low** | Add reconciliation status tracking | Medium |

---

## 7. Recommended Next Steps

### Immediate (1-2 weeks)

1. **Transaction Attachments**
   - Create `transaction_attachments` table
   - Add linking to transactions in UI
   - Add file upload component

2. **DB Schema for Multi-Provider**
   - Add `providerId` to `bank_connections`
   - Add `externalProviderAccountId` to `bank_accounts`
   - Add `balance` and `lastSyncedAt` fields

### Short-term (2-4 weeks)

3. **Mono Provider Scaffold**
   - Create `packages/banking/src/providers/mono/`
   - Implement MonoProvider class
   - Create MonoApi client
   - Wire into provider facade

4. **Bank Connection UI**
   - Create bank connection flow components
   - Add provider selection UI
   - Implement account selection flow

### Medium-term (4-8 weeks)

5. **Dashboard Flows**
   - Transaction sync from bank
   - Reconciliation UI
   - Overview enhancements (category breakdown, etc.)

---

## 8. File References

### Transaction Files
- `packages/db/src/schema/financial.ts` - Transaction, category, bank account schema
- `packages/db/src/queries/transactions.ts` - Transaction queries
- `packages/db/src/queries/overview.ts` - Overview totals
- `packages/api/src/routers/transactions.ts` - Transaction tRPC router
- `apps/dashboard/src/components/forms/transaction-create-form.tsx` - Create form
- `apps/dashboard/src/components/forms/transaction-edit-form.tsx` - Edit form
- `apps/dashboard/src/components/tables/transactions/transactions-table.tsx` - Table view

### Banking Files
- `packages/db/src/schema/financial.ts` - Bank connection/account schema
- `packages/api/src/routers/bank-accounts.ts` - Bank accounts router

### Wiki References
- `.references/midday-wiki/content/Business Features/Banking Integration/Banking Integration.md`
- `.references/midday-wiki/content/Shared Packages/Banking Integration (@midday_banking).md`
- `.references/midday-wiki/content/Core Applications/API Application/REST API Endpoints/Bank Account Management Endpoints.md`

---

*Generated from audit on 2026-04-07*
