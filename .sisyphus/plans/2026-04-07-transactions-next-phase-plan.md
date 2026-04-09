# Transactions Next Phase Plan

## Goal

Make transactions trustworthy enough to support Faworra's Business OS direction before adding heavier automation. This phase hardens transaction correctness, account/category consistency, and the review surface that later Vault, Mono, and AI workflows will depend on.

## Explicit contract decisions

### 1. Amount invariant

- `transactions.amount` remains the stored source of truth in **signed minor units**.
- `income` transactions store a positive amount.
- `expense` transactions store a negative amount.
- `kind` remains a workflow and validation field, not the primary source for deriving sign.

### 2. Category invariant

- `categorySlug` becomes the **canonical semantic category reference** for writes and reads.
- `categoryId` remains temporarily supported as a transitional join field while the app is normalized.
- The create/update path must resolve a valid team-owned category and persist `categorySlug` consistently.

### 3. Account invariant

- If `bankAccountId` is provided, it must belong to the active team.
- Transactions may remain manual and unlinked to an account only when the user explicitly leaves them unassigned.
- The UI must expose account choice on the main transaction flow instead of treating `bankAccountId` as hidden optional data.

### 4. Review invariant

- `status` and `internal` must drive transaction review behaviour.
- In this phase, the minimum useful state model is:
  - `pending`: needs review,
  - `posted`: reviewed/accepted,
  - `excluded`: intentionally excluded.
- `internal` continues to mean “exclude from reports / avoid double counting,” but it must be visible in the main transactions surface.

## Why this phase comes next

The current flow can create manual transactions, but it is not yet safe enough for reporting or broad enough for later operator workflows. Evidence in the current repo:

- `apps/dashboard/src/components/forms/transaction-create-form.tsx` writes signed amounts.
- `packages/db/src/queries/overview.ts` still derives totals from `kind`, which conflicts with signed storage.
- `packages/db/src/schema/financial.ts` carries both `categorySlug` and `categoryId`, but the router and form still behave as if `categoryId` is primary.
- `packages/api/src/routers/transactions.ts` validates category ownership but does not validate account ownership.
- `apps/dashboard/src/components/tables/transactions/transactions-table.tsx` is still a thin list, not a review surface.

## Phase 1 — Transaction correctness and minimal review workflow

### Workstream 1: Lock the accounting contract

#### Files

- `packages/db/src/schema/financial.ts`
- `packages/db/src/queries/transactions.ts`
- `packages/db/src/queries/overview.ts`
- `packages/api/src/routers/transactions.ts`
- `apps/dashboard/src/components/forms/transaction-create-form.tsx`
- `apps/dashboard/src/components/tables/transactions/transactions-table.tsx`

#### Tasks

1. Align create and update writes to the signed-minor-units invariant.
2. Make overview totals and any surfaced transaction summaries calculate from the stored signed amount instead of re-deriving sign from `kind`.
3. Ensure the table and form present amounts consistently for both income and expense.

#### QA

- Create one income and one expense from the dashboard transactions screen.
- Verify the table shows positive income and negative expense formatting correctly.
- Verify overview totals no longer invert or double-negate expenses.
- Run:
  - `npx ultracite check packages/db/src/queries/overview.ts packages/db/src/queries/transactions.ts packages/api/src/routers/transactions.ts apps/dashboard/src/components/forms/transaction-create-form.tsx apps/dashboard/src/components/tables/transactions/transactions-table.tsx`

### Workstream 2: Normalize category semantics

#### Files

- `packages/db/src/schema/financial.ts`
- `packages/db/src/queries/transactions.ts`
- `packages/api/src/routers/transactions.ts`
- `apps/dashboard/src/components/forms/transaction-create-form.tsx`

#### Tasks

1. Make the router resolve category input into the canonical stored `categorySlug` path.
2. Keep transitional support for `categoryId` only where needed for joins or existing data.
3. Ensure category validation remains team-scoped and kind-compatible.

#### QA

- Create an expense with a valid expense category and confirm it persists correctly.
- Attempt to submit an income with an expense-only category and verify rejection.
- Verify uncategorized transactions still work.
- Run:
  - `npx ultracite check packages/db/src/schema/financial.ts packages/db/src/queries/transactions.ts packages/api/src/routers/transactions.ts apps/dashboard/src/components/forms/transaction-create-form.tsx`

### Workstream 3: Validate account ownership and expose account choice

#### Files

- `packages/db/src/schema/financial.ts`
- `packages/db/src/queries/transactions.ts`
- `packages/api/src/routers/transactions.ts`
- `apps/dashboard/src/components/forms/transaction-create-form.tsx`
- `apps/dashboard/src/components/tables/transactions/transactions-table.tsx`
- `apps/dashboard/src/app/[locale]/(app)/(sidebar)/transactions/page.tsx`

#### Tasks

1. Add a team-valid account selection path to the live transaction form.
2. Validate `bankAccountId` in the router against the active team before create/update.
3. Surface account information in the review screen so records can be reviewed in context.

#### QA

- Create a transaction with a valid account and verify it is returned in the list with account context.
- Create a transaction without an account and verify the UI treats it as explicitly unassigned/manual.
- Attempt to submit a cross-team or invalid account ID and verify rejection.
- Run:
  - `npx ultracite check packages/api/src/routers/transactions.ts apps/dashboard/src/components/forms/transaction-create-form.tsx apps/dashboard/src/components/tables/transactions/transactions-table.tsx apps/dashboard/src/app/[locale]/(app)/(sidebar)/transactions/page.tsx`

### Workstream 4: Make review state real

#### Files

- `packages/db/src/schema/financial.ts`
- `packages/db/src/queries/transactions.ts`
- `packages/api/src/routers/transactions.ts`
- `apps/dashboard/src/components/forms/transaction-create-form.tsx`
- `apps/dashboard/src/components/tables/transactions/transactions-table.tsx`

#### Tasks

1. Make `status` explicit in the review experience instead of an invisible storage field.
2. Make `internal` visible and understandable from the main transaction surface.
3. Support the minimum useful filtered review modes around pending, posted, excluded, and internal records.

#### QA

- Create a transaction marked internal and verify it is visibly distinguished.
- Filter transactions by review state and confirm the list updates correctly.
- Ensure excluded records do not silently mix into the default active list.
- Run:
  - `npx ultracite check packages/db/src/queries/transactions.ts apps/dashboard/src/components/forms/transaction-create-form.tsx apps/dashboard/src/components/tables/transactions/transactions-table.tsx`

### Workstream 5: Ship one real review surface

#### Files

- `apps/dashboard/src/components/tables/transactions/transactions-table.tsx`
- `apps/dashboard/src/components/forms/transaction-create-form.tsx`
- `apps/dashboard/src/app/[locale]/(app)/(sidebar)/transactions/page.tsx`
- `apps/dashboard/src/app/[locale]/(app)/(sidebar)/transactions/transaction-form.tsx`

#### Tasks

1. Standardize on the active transactions page and table path as the main surface.
2. Stop expanding duplicate transaction form/table implementations in parallel.
3. Add the minimum useful filters and review cues to the main page.
4. For any touched UI, copy Midday's implementation and presentation structure where technically possible under the Midday parity rule.

#### QA

- Open the transactions page and confirm one clear create/review path exists.
- Verify the main page supports creating a transaction and immediately reviewing it from the same surface.
- Visually compare touched UI against Midday's corresponding surface and document any forced deviations.
- Run:
  - `npx ultracite check apps/dashboard/src/components/tables/transactions/transactions-table.tsx apps/dashboard/src/components/forms/transaction-create-form.tsx apps/dashboard/src/app/[locale]/(app)/(sidebar)/transactions/page.tsx apps/dashboard/src/app/[locale]/(app)/(sidebar)/transactions/transaction-form.tsx`

## Phase 1 success criteria

- One amount/sign rule is enforced everywhere.
- Category writes are internally consistent and centered on `categorySlug`.
- Bank account references are team-valid.
- `status` and `internal` affect review behaviour clearly.
- A user can create, inspect, and correct transactions from the main transactions surface.

## Phase 2 — Evidence-ready transactions

### Scope

- Add transaction-to-document and transaction-to-receipt linking.
- Expand queries for search, exception queues, uncategorized items, and transaction detail views.
- Make Vault useful for transactions, not just documents in isolation.

## Phase 3 — Automation and operator workflows

### Scope

- Add Mono import flows and imported transaction review.
- Add reconciliation-oriented workflows.
- Add automation hooks for categorization suggestions, summaries, and operator actions.

## Immediate implementation slice

Start with Workstreams 1 and 2 together, because the amount contract and category contract are the two most destabilizing inconsistencies in the current codebase. Then implement Workstream 3 before expanding UI review behaviour, so the review surface is built on valid account-linked records.
