# Faworra Audit: Transactions UI

**Date:** 2026-04-07  
**Purpose:** Audit of Faworra's transaction UI components against Midday patterns

---

## 1. UI Components Overview

### Files Analyzed

| File | Purpose |
|------|---------|
| `apps/dashboard/src/app/[locale]/(app)/(sidebar)/transactions/page.tsx` | Transactions page (server component) |
| `apps/dashboard/src/components/tables/transactions/transactions-table.tsx` | Main transactions table |
| `apps/dashboard/src/components/forms/transaction-create-form.tsx` | Create transaction sheet |
| `apps/dashboard/src/components/forms/transaction-edit-form.tsx` | Edit transaction wrapper |
| `apps/dashboard/src/components/tables/transactions/search-params.ts` | URL search state management |

---

## 2. What's Implemented ✅

### Transaction Table (`transactions-table.tsx`)
- ✅ Filter bar with search (description, note, currency, category)
- ✅ Date range filters (dateFrom, dateTo)
- ✅ Amount range filters (minAmount, maxAmount)
- ✅ Kind filter (expense/income)
- ✅ Status filter (pending/posted/excluded)
- ✅ Account filter dropdown
- ✅ Category filter dropdown
- ✅ Internal/external filter
- ✅ Tab navigation (All transactions / Review queue)
- ✅ Pagination via cursor-based loading
- ✅ Role-based write access (owner/admin/accountant can edit)
- ✅ Review state transitions (Post, Exclude, Include)
- ✅ Date formatting (locale-aware)
- ✅ Amount formatting with currency symbol
- ✅ Color coding (green for income, red for expense)
- ✅ Empty state handling
- ✅ Server-side prefetching

### Transaction Form (`transaction-create-form.tsx`)
- ✅ Kind toggle (expense/income)
- ✅ Description field
- ✅ Amount field (converts to/from minor units)
- ✅ Currency field
- ✅ Date picker
- ✅ Bank account selector (dropdown)
- ✅ Category selector (filtered by kind)
- ✅ Note field (textarea)
- ✅ Internal/exclude from reports toggle
- ✅ Form validation (Zod schema)
- ✅ Create mutation
- ✅ Update mutation (reuses form)
- ✅ Optimistic UI updates
- ✅ Error handling with toast notifications

### Page (`transactions/page.tsx`)
- ✅ Server-side data prefetching
- ✅ Suspense fallback loading states
- ✅ Dynamic currency from team settings

---

## 3. What's Missing ❌

### Attachments & Documents
- ❌ No file upload/attachment UI
- ❌ No receipt linking
- ❌ No document preview

### Banking Integration UI
- ❌ No bank account connection flow
- ❌ No transaction sync status indicator
- ❌ No institution/provider display
- ❌ No "linked to bank" vs "manual" visual distinction

### Category Features
- ❌ No category color display in table
- ❌ No category creation/editing UI
- ❌ No category hierarchy visualization (parentSlug)

### Transaction Details
- ❌ No transaction detail modal/drawer
- ❌ No duplicate transaction detection UI
- ❌ No suggested matches display
- ❌ No transaction timeline/history

### Bulk Actions
- ❌ No bulk delete
- ❌ No bulk category assignment
- ❌ No bulk status change

### Export/Import
- ❌ No CSV export
- ❌ No CSV import
- ❌ No PDF export

### Advanced Filtering
- ❌ No date quick picks (Today, This week, This month, Last month)
- ❌ No saved filter presets
- ❌ No recent searches

### Reconciliation
- ❌ No reconciliation status column
- ❌ No "mark as reconciled" action
- ❌ No matched transaction display

### Visual Features
- ❌ No transaction tags display
- ❌ No merchant/counterparty name display
- ❌ No payment method indicator

---

## 4. UI/UX Gap Analysis (vs Midday Patterns)

| Feature | Midday Pattern | Faworra Current |
|---------|----------------|-----------------|
| Transaction details drawer | Yes - full details with attachments | ❌ Missing |
| Category color chip | Yes - visible in table | ❌ Missing |
| Bank account display | Shows institution logo + account name | Shows name only |
| Attachments | Paperclip icon, click to view | ❌ Missing |
| Reconciliation | Status column + actions | ❌ Missing |
| Bulk actions | Multi-select with batch operations | ❌ Missing |
| Export | CSV/Excel export button | ❌ Missing |
| Quick filters | Date presets (Today, This week...) | ❌ Missing |
| Search suggestions | Autocomplete categories/accounts | ❌ Missing |

---

## 5. Technical Observations

### Positive Patterns
- Clean separation of search state from URL params
- Proper use of React Query for data fetching
- Cursor-based pagination for large datasets
- Role-based access control
- Optimistic updates with proper invalidation
- Server-side prefetching for initial load

### Issues to Address
1. **Native `<select>` elements** - Using native select instead of custom combobox; inconsistent with shadcn patterns
2. **No loading skeletons** - Table shows empty state during load instead of skeleton
3. **Form reset** - Form doesn't fully reset after create (potential stale state)
4. **Category filter** - Uses `categorySlug` in filter but `categoryId` in form (potential confusion)
5. **No optimistic delete** - No delete mutation available

---

## 6. Recommended UI Improvements

### High Priority
1. **Transaction attachments**
   - Add file upload to form
   - Add attachment indicator to table
   - Create attachment viewer modal

2. **Category color display**
   - Add colored dot/chip in table category column
   - Make category selector a proper combobox

3. **Transaction detail drawer**
   - Create detail view with full transaction info
   - Show attachments, category, bank account details

### Medium Priority
4. **Quick date filters**
   - Add preset buttons (Today, This week, This month)

5. **Bank account visual**
   - Show account type icon (bank vs momo vs cash)
   - Display provider when available

6. **Export functionality**
   - Add CSV export button

### Low Priority
7. **Bulk actions**
   - Add multi-select checkboxes
   - Batch category assignment

8. **Saved filters**
   - Allow saving filter presets

---

## 7. File References

### Core UI Files
- `/home/louis/developer/faworra/faworra-new/apps/dashboard/src/components/tables/transactions/transactions-table.tsx`
- `/home/louis/developer/faworra/faworra-new/apps/dashboard/src/components/forms/transaction-create-form.tsx`
- `/home/louis/developer/faworra/faworra-new/apps/dashboard/src/components/forms/transaction-edit-form.tsx`
- `/home/louis/developer/faworra/faworra-new/apps/dashboard/src/components/tables/transactions/search-params.ts`
- `/home/louis/developer/faworra/faworra-new/apps/dashboard/src/app/[locale]/(app)/(sidebar)/transactions/page.tsx`

### Related Files
- `/home/louis/developer/faworra/faworra-new/packages/api/src/routers/transactions.ts`
- `/home/louis/developer/faworra/faworra-new/packages/api/src/routers/bank-accounts.ts`
- `/home/louis/developer/faworra/faworra-new/packages/db/src/schema/financial.ts`

---

*Generated from UI audit on 2026-04-07*
