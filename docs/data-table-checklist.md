# Data Table Implementation Checklist

Quick reference checklist for implementing data table pages. See [coding-guidelines-data-tables.md](./coding-guidelines-data-tables.md) for detailed explanations.

---

## 🚀 Before You Start

- [ ] Read [coding-guidelines-data-tables.md](./coding-guidelines-data-tables.md)
- [ ] Check existing tables (transactions, clients, orders) for reference
- [ ] Ensure dependencies installed: `@tanstack/react-virtual`, `nuqs`, `react-intersection-observer`

---

## 📁 File Structure

- [ ] Create `page.tsx` (Server Component)
- [ ] Create `_components/feature-view.tsx` (Main Client Component)
- [ ] Create `_components/feature-columns.tsx` (Column definitions)
- [ ] Create `_hooks/use-feature-invalidation.ts` (Shared invalidation)
- [ ] Create `_hooks/use-feature-filters.ts` (Filter management)

---

## 🎯 Server Component (page.tsx)

- [ ] Async function
- [ ] Get teamId with `getCurrentTeamId()`
- [ ] Fetch initial data with direct DB query
- [ ] Pass data as `initialData` prop
- [ ] NO hooks, NO 'use client'

```typescript
export default async function FeaturePage() {
  const teamId = await getCurrentTeamId();
  const data = await getFeatures(db, { teamId, limit: 50 });
  return <FeatureView initialData={data} />;
}
```

---

## 💻 Client Component (feature-view.tsx)

### Imports
- [ ] `'use client'` directive at top
- [ ] `useSuspenseInfiniteQuery` from `@tanstack/react-query`
- [ ] `useVirtualizer` from `@tanstack/react-virtual`
- [ ] `useInView` from `react-intersection-observer`
- [ ] Custom hooks from `_hooks/`
- [ ] Type imports from `@Faworra/api/trpc/routers/_app`

### Data Fetching
- [ ] Use `useSuspenseInfiniteQuery` (NOT `useInfiniteQuery`)
- [ ] Pass `initialData` from props
- [ ] Set `staleTime: 15_000`
- [ ] Set `refetchOnWindowFocus: false`
- [ ] Implement `getNextPageParam`

### Infinite Scroll
- [ ] Use `useInView` hook with `rootMargin: "200px"`
- [ ] `useEffect` to call `fetchNextPage` when `inView`
- [ ] Render sentinel `<div ref={loadMoreRef} />`

### Virtualization (if > 50 rows)
- [ ] Create `tableContainerRef` with `useRef`
- [ ] Configure `useVirtualizer` with `enabled: length > 50`
- [ ] Set `estimateSize: () => 60`
- [ ] Set `overscan: 10`
- [ ] Calculate `paddingTop` and `paddingBottom`
- [ ] Render only `virtualRows`

### Real-time Updates
- [ ] Import `createBrowserClient` from `@Faworra/supabase/client`
- [ ] Create Supabase channel subscription
- [ ] Listen for `postgres_changes` events
- [ ] Only refetch when needed
- [ ] Add fallback timeout (60s)
- [ ] Clean up subscription in return

---

## 🎨 Column Definitions (feature-columns.tsx)

- [ ] Export `createFeatureColumns` function
- [ ] Accept context object with callbacks
- [ ] Return `ColumnDef<FeatureRow>[]`
- [ ] Include select column (checkbox)
- [ ] Include actions column (dropdown menu)
- [ ] Extract complex cells to separate files
- [ ] Use proper TypeScript types (NO `any`)

---

## 🪝 Custom Hooks

### use-feature-invalidation.ts
- [ ] Export `useFeatureInvalidation` function
- [ ] Return `useCallback` that invalidates all related queries
- [ ] Use `Promise.all` for parallel invalidation

### use-feature-filters.ts
- [ ] Use `useQueryStates` from `nuqs`
- [ ] Parse all filter types properly
- [ ] Return `enrichedInput` for API
- [ ] Return `hasActiveFilters` boolean
- [ ] Return `clearAllFilters` function
- [ ] Memoize computed values

---

## 🔄 Mutations

### All Mutations Must Have:
- [ ] Use shared `invalidateFeatures` hook
- [ ] Implement optimistic updates in `onMutate`
- [ ] Rollback on error in `onError`
- [ ] Invalidate queries in `onSettled`
- [ ] Show loading state with `isPending`
- [ ] Show toast notifications

```typescript
const mutation = trpc.features.update.useMutation({
  async onMutate(variables) {
    await queryClient.cancelQueries({ queryKey: ["features.list"] });
    const previous = queryClient.getQueryData(["features.list"]);
    // Optimistic update
    return { previous };
  },
  onError: (_err, _vars, ctx) => {
    if (ctx?.previous) {
      queryClient.setQueryData(["features.list"], ctx.previous);
    }
  },
  onSettled: async () => {
    await invalidateFeatures();
  },
});
```

---

## ⌨️ Keyboard Navigation

- [ ] Implement Arrow Up/Down (navigate rows)
- [ ] Implement Home/End (jump to first/last)
- [ ] Implement Space (toggle selection)
- [ ] Implement Shift+Space (range selection)
- [ ] Implement Enter (open details)
- [ ] Integrate with virtualization (scroll to focused row)
- [ ] Add `role="application"` to table container
- [ ] Add `aria-label` for accessibility

---

## 🎭 UI/UX Requirements

### Loading States
- [ ] Suspense boundary (handled by useSuspenseInfiniteQuery)
- [ ] Refetch indicator (subtle top bar)
- [ ] Infinite scroll loading (at bottom)
- [ ] Mutation loading (button states)

### Empty States
- [ ] No data state (with create action)
- [ ] No results state (with clear filters action)
- [ ] Error state (with retry action)

### Sticky Elements
- [ ] Sticky header (`position: sticky; top: 0; z-index: 20`)
- [ ] Sticky columns (`position: sticky; left: 0; z-index: 10`)
- [ ] Proper z-index hierarchy

---

## 🔒 TypeScript Requirements

- [ ] NO `any` types anywhere
- [ ] Use `RouterOutputs` for API types
- [ ] Type all function parameters
- [ ] Type all mutation variables
- [ ] Handle nulls with `??` or `?.`
- [ ] Use `Record<string, unknown>` for generic objects
- [ ] `bun run typecheck` passes with no errors

---

## 🧪 Testing Checklist

### Performance
- [ ] Initial load < 400ms
- [ ] 1000 rows render < 100ms
- [ ] Smooth scrolling (60fps)
- [ ] No memory leaks (check Chrome Task Manager)

### Functionality
- [ ] Infinite scroll loads more data
- [ ] Filters apply correctly
- [ ] Search works
- [ ] Selection works (single, range, all)
- [ ] Keyboard navigation works
- [ ] Mutations update optimistically
- [ ] Real-time updates arrive
- [ ] Column visibility persists

### Code Quality
- [ ] No files > 300 lines
- [ ] No unused variables
- [ ] No console.log statements
- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes

---

## 📊 Performance Benchmarks

Run these checks before committing:

```bash
# Type check
bun run typecheck

# Lint
bun run lint

# Build (check bundle size)
bun run build
```

**Manual checks:**
1. Open Chrome DevTools → Performance
2. Record while scrolling through 1000 rows
3. Verify 60fps
4. Check memory usage < 50MB

---

## 🚫 Common Mistakes to Avoid

- [ ] ❌ Using `useInfiniteQuery` instead of `useSuspenseInfiniteQuery`
- [ ] ❌ Using `prefetch()` or `HydrateClient`
- [ ] ❌ Polling with `setInterval` instead of real-time
- [ ] ❌ No virtualization for large lists
- [ ] ❌ Using `any` types
- [ ] ❌ Duplicate invalidation logic
- [ ] ❌ No optimistic updates
- [ ] ❌ Inline complex logic (should extract)
- [ ] ❌ Files > 300 lines
- [ ] ❌ No keyboard navigation

---

## ✅ Final Review

Before marking as complete:

- [ ] All checklist items above are checked
- [ ] Code follows [coding-guidelines-data-tables.md](./coding-guidelines-data-tables.md)
- [ ] Performance benchmarks met
- [ ] TypeScript strict mode passes
- [ ] Tested with small dataset (< 50 rows)
- [ ] Tested with large dataset (1000+ rows)
- [ ] Keyboard navigation works
- [ ] Real-time updates work
- [ ] No console errors
- [ ] Code reviewed by team

---

## 📚 Reference Files

- **Detailed Guidelines:** [coding-guidelines-data-tables.md](./coding-guidelines-data-tables.md)
- **Example Implementation:** `apps/dashboard/src/app/(dashboard)/transactions/`
- **Custom Hooks:** `apps/dashboard/src/app/(dashboard)/transactions/_hooks/`

---

## 🎯 Quick Start Template

```bash
# 1. Create structure
mkdir -p feature/_components feature/_hooks

# 2. Copy templates from transactions
cp transactions/page.tsx feature/
cp transactions/_hooks/use-transactions-invalidation.ts feature/_hooks/use-feature-invalidation.ts
cp transactions/_hooks/use-transactions-filters.ts feature/_hooks/use-feature-filters.ts

# 3. Find and replace
# transactions → feature
# Transaction → Feature

# 4. Implement following this checklist
```

---

**Remember:** It's easier to build it right the first time than to refactor later! ✨