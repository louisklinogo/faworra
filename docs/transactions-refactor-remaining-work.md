# Transactions Page Refactor - Remaining Work

## ✅ Phase 1 Complete (Done)
- [x] Switch to useSuspenseInfiniteQuery
- [x] Remove debug console logs
- [x] Create shared invalidation hook
- [x] Fix TypeScript `any` types
- [x] Add @tanstack/react-virtual dependency
- [x] Create custom hooks (invalidation, keyboard navigation, filters)

---

## 🚀 Phase 2: Performance Optimizations (Next Priority)

### 2.1 Table Virtualization ⏳
**Status:** Ready to implement (dependency added)  
**Effort:** 2 hours  
**Priority:** High  
**Impact:** Handle 10,000+ transactions smoothly

**Tasks:**
- [ ] Import and configure `useVirtualizer` from @tanstack/react-virtual
- [ ] Update table rendering to use virtual rows
- [ ] Adjust sticky column positioning for virtualized rows
- [ ] Test with large datasets (1000+ rows)
- [ ] Verify scroll performance

**Files to modify:**
- `apps/dashboard/src/app/(dashboard)/transactions/_components/transactions-view.tsx`

**Code snippet:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);
const rowVirtualizer = useVirtualizer({
  count: tableData.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60, // row height
  overscan: 10,
});
```

---

### 2.2 Replace Polling with Real-time Subscriptions ⏳
**Status:** Ready to implement  
**Effort:** 1 hour  
**Priority:** Medium  
**Impact:** Reduce unnecessary API calls, better UX

**Current Issue:**
- Lines 528-543 in transactions-view.tsx poll every 3 seconds for 60 seconds
- Inefficient and wastes resources

**Solution:**
- Use Supabase real-time subscriptions for enrichment status updates
- Only refetch when actual changes occur

**Tasks:**
- [ ] Remove polling useEffect (lines 528-543)
- [ ] Add Supabase real-time channel subscription
- [ ] Listen for UPDATE events on transactions table
- [ ] Filter by team_id and enrichment_completed field
- [ ] Refetch only when enrichment completes

**Files to modify:**
- `apps/dashboard/src/app/(dashboard)/transactions/_components/transactions-view.tsx`

**Code snippet:**
```typescript
useEffect(() => {
  if (!shouldPollForEnrichment) return;
  
  const supabase = createBrowserClient();
  const channel = supabase
    .channel('transactions-enrichment')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'transactions',
      filter: `team_id=eq.${teamId}`,
    }, (payload) => {
      if (payload.new.enrichment_completed) {
        refetch();
      }
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [shouldPollForEnrichment, refetch, teamId]);
```

---

### 2.3 Optimize TagsCell Caching ⏳
**Status:** Ready to implement  
**Effort:** 15 minutes  
**Priority:** Low  
**Impact:** Reduce unnecessary tag list fetches

**Tasks:**
- [ ] Add `gcTime: 300_000` to tags query in TagsCell
- [ ] Verify tags persist in cache between popover opens

**Files to modify:**
- `apps/dashboard/src/app/(dashboard)/transactions/_components/transactions-columns.tsx` (lines 360-361)

---

## 🏗️ Phase 3: Code Quality & Architecture (Optional)

### 3.1 Split Large Component ⏳
**Status:** Not started  
**Effort:** 3-4 hours  
**Priority:** Medium  
**Impact:** Better maintainability, easier testing

**Current Issue:**
- `transactions-view.tsx` is 1186 lines (too large)

**Proposed Structure:**
```
transactions/
├── page.tsx (Server Component)
├── _components/
│   ├── transactions-view.tsx (Orchestrator - 200 lines)
│   ├── transactions-table.tsx (Table rendering - 300 lines)
│   ├── transactions-toolbar.tsx (Toolbar - 150 lines)
│   ├── transactions-filters.tsx (Filters - 200 lines)
│   ├── transactions-columns.tsx (Existing)
│   └── tags-cell.tsx (Extract TagsCell - 150 lines)
├── _hooks/
│   ├── use-transactions-data.ts (Data fetching - 100 lines)
│   ├── use-transactions-mutations.ts (Mutations - 150 lines)
│   ├── use-transactions-filters.ts (✅ Done)
│   ├── use-keyboard-navigation.ts (✅ Done)
│   └── use-transactions-invalidation.ts (✅ Done)
```

**Tasks:**
- [ ] Extract TransactionsTable component
- [ ] Extract TransactionsToolbar component
- [ ] Extract TransactionsFilters component
- [ ] Extract TagsCell component
- [ ] Create use-transactions-data hook
- [ ] Create use-transactions-mutations hook
- [ ] Update imports in transactions-view.tsx
- [ ] Test all functionality

---

### 3.2 Remove Unused Variables ⏳
**Status:** Ready to implement  
**Effort:** 15 minutes  
**Priority:** Low  

**Tasks:**
- [ ] Remove or use `_deleteDialogOpen` (line 144)
- [ ] Remove or use `_openAllocate` (line 554)
- [ ] Remove or use `_toggleAll` (line 561)

---

### 3.3 Simplify Sticky Columns ⏳
**Status:** Not started  
**Effort:** 30 minutes  
**Priority:** Low  

**Current:** Uses JS to calculate offsets  
**Better:** Use pure CSS `position: sticky`

**Tasks:**
- [ ] Replace JS sticky column logic with CSS
- [ ] Test sticky behavior on scroll
- [ ] Verify z-index layering

---

## 🎨 Phase 4: Minor Improvements (Nice to Have)

### 4.1 Add Loading Skeletons ⏳
**Status:** Not started  
**Effort:** 30 minutes  

**Tasks:**
- [ ] Add skeleton loaders for initial data fetch
- [ ] Add subtle loading indicator when refetching
- [ ] Improve perceived performance

---

### 4.2 Add Error Boundaries ⏳
**Status:** Not started  
**Effort:** 1 hour  

**Tasks:**
- [ ] Wrap transactions page in error boundary
- [ ] Add fallback UI for errors
- [ ] Log errors to monitoring service

---

### 4.3 Consolidate Filter UI ⏳
**Status:** Not started  
**Effort:** 30 minutes  

**Decision needed:** Keep FilterToolbar or legacy filter components?  
**Recommendation:** Keep FilterToolbar (newer, cleaner)

**Tasks:**
- [ ] Remove legacy filter sheet components
- [ ] Ensure all filters work with FilterToolbar
- [ ] Update documentation

---

## 📊 Priority Ranking

### Must Do (High Impact, Low Effort):
1. ✅ Phase 1 - All items (DONE)
2. 🔴 Phase 2.1 - Table Virtualization (2 hours)
3. 🔴 Phase 2.2 - Real-time Subscriptions (1 hour)

### Should Do (Medium Impact):
4. 🟡 Phase 2.3 - Optimize TagsCell (15 mins)
5. 🟡 Phase 3.2 - Remove Unused Variables (15 mins)

### Nice to Have (Lower Priority):
6. 🟢 Phase 3.1 - Split Component (3-4 hours)
7. 🟢 Phase 3.3 - Simplify Sticky Columns (30 mins)
8. 🟢 Phase 4.1 - Loading Skeletons (30 mins)
9. 🟢 Phase 4.2 - Error Boundaries (1 hour)
10. 🟢 Phase 4.3 - Consolidate Filter UI (30 mins)

---

## ⏱️ Time Estimates

| Phase | Status | Time | Priority |
|-------|--------|------|----------|
| Phase 1 | ✅ Done | 3 hours | High |
| Phase 2 | ⏳ Ready | 3-4 hours | High |
| Phase 3 | ⏳ Ready | 4-6 hours | Medium |
| Phase 4 | ⏳ Ready | 2 hours | Low |
| **Total Remaining** | | **9-12 hours** | |

---

## 🎯 Recommended Next Steps

### This Week:
1. Run `bun install` to install @tanstack/react-virtual
2. Implement Phase 2.1 (Virtualization) - 2 hours
3. Implement Phase 2.2 (Real-time) - 1 hour
4. Quick wins: Phase 2.3 + 3.2 - 30 mins

**Total: ~3.5 hours for major performance boost**

### Next Week:
5. Phase 3.1 (Component splitting) - 3-4 hours
6. Phase 4 improvements - 2 hours

---

## 🚦 Current Status

**Completed:** Phase 1 (Critical Fixes)  
**Next Up:** Phase 2 (Performance)  
**Blocked:** None  
**Dependencies:** Need to run `bun install`

---

## 📝 Notes

- All Phase 1 changes are backward compatible
- No breaking changes to API or user experience
- Performance improvements will be immediately noticeable
- Code quality improvements make future work easier

---

## 🎉 Quick Win Opportunity

**Want immediate impact?** Do this in 30 minutes:
1. Phase 2.3 - Optimize TagsCell caching (15 mins)
2. Phase 3.2 - Remove unused variables (15 mins)

Then tackle virtualization and real-time for the big performance wins!