# Data Table Implementation Guidelines

## 🎯 Purpose
These guidelines ensure all data table pages (transactions, clients, orders, invoices, etc.) follow consistent, performant patterns from the start. Following these prevents the need for major refactoring later.

---

## 📋 Table of Contents
1. [Architecture Pattern](#architecture-pattern)
2. [Performance Requirements](#performance-requirements)
3. [TypeScript Standards](#typescript-standards)
4. [Component Organization](#component-organization)
5. [Data Fetching](#data-fetching)
6. [State Management](#state-management)
7. [UI/UX Patterns](#uiux-patterns)
8. [Testing Checklist](#testing-checklist)

---

## 1. Architecture Pattern

### ✅ Required Structure

```
feature/
├── page.tsx                    # Server Component (data fetching)
├── _components/
│   ├── feature-view.tsx       # Main client component (orchestrator)
│   ├── feature-table.tsx      # Table rendering (optional extraction)
│   ├── feature-columns.tsx    # Column definitions
│   ├── feature-toolbar.tsx    # Toolbar actions (optional extraction)
│   └── [feature-cell].tsx     # Complex cell components
├── _hooks/
│   ├── use-feature-data.ts    # Data fetching logic
│   ├── use-feature-filters.ts # Filter state management
│   ├── use-feature-mutations.ts # Mutation logic
│   └── use-feature-invalidation.ts # Shared invalidation
```

### ❌ Anti-patterns to Avoid
- ❌ Single 1000+ line component file
- ❌ Mixing server and client logic in one file
- ❌ Inline complex logic without extraction
- ❌ Duplicate invalidation logic across mutations

---

## 2. Performance Requirements

### 2.1 Data Fetching Pattern (CRITICAL)

**✅ ALWAYS use useSuspenseInfiniteQuery:**

```typescript
// ✅ CORRECT - Server Component
export default async function FeaturePage() {
  const teamId = await getCurrentTeamId();
  const data = await getFeatures(db, { teamId, limit: 50 });
  
  return <FeatureView initialData={data} />;
}

// ✅ CORRECT - Client Component
"use client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

export function FeatureView({ initialData = [] }) {
  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
    queryKey: ["features.list", filters],
    queryFn: async ({ pageParam }) => {
      const result = await utils.client.features.list.query({
        ...filters,
        cursor: pageParam,
      });
      return result;
    },
    getNextPageParam: (last) => last?.nextCursor ?? null,
    initialData: initialData.length > 0 ? {
      pages: [{ items: initialData, nextCursor: null }],
      pageParams: [null],
    } : undefined,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
  
  // ...
}
```

**❌ NEVER use:**
- `useInfiniteQuery` (use `useSuspenseInfiniteQuery` instead)
- `prefetch()` or `HydrateClient` (causes double-fetching)
- Client-side only data fetching (no initialData)

### 2.2 Table Virtualization (REQUIRED for 50+ rows)

**✅ ALWAYS implement virtualization:**

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

const tableContainerRef = useRef<HTMLDivElement>(null);
const rowVirtualizer = useVirtualizer({
  count: tableData.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 60, // row height in pixels
  overscan: 10,
  enabled: tableData.length > 50, // Only virtualize if needed
});

const virtualRows = rowVirtualizer.getVirtualItems();
const totalSize = rowVirtualizer.getTotalSize();
const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
const paddingBottom = virtualRows.length > 0 
  ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) 
  : 0;

// Render only virtual rows
<div ref={tableContainerRef} className="overflow-auto max-h-[calc(100vh-400px)]">
  <Table>
    <TableBody>
      {paddingTop > 0 && <tr><td style={{ height: `${paddingTop}px` }} /></tr>}
      {virtualRows.map((virtualRow) => {
        const row = table.getRowModel().rows[virtualRow.index];
        return <TableRow key={row.id}>{/* cells */}</TableRow>;
      })}
      {paddingBottom > 0 && <tr><td style={{ height: `${paddingBottom}px` }} /></tr>}
    </TableBody>
  </Table>
</div>
```

**Performance Targets:**
- Initial load: < 400ms
- 1000 rows render: < 100ms
- Scroll performance: 60fps

### 2.3 Real-time Updates (REQUIRED)

**✅ ALWAYS use Supabase real-time instead of polling:**

```typescript
// ✅ CORRECT - Real-time subscription
useEffect(() => {
  if (!shouldListenForUpdates) return;
  
  const supabase = createBrowserClient();
  const channel = supabase
    .channel('feature-updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'features',
    }, (payload) => {
      if (payload.new && shouldRefetch(payload.new)) {
        refetch();
      }
    })
    .subscribe();

  // Fallback timeout
  const timeout = setTimeout(() => refetch(), 60_000);

  return () => {
    supabase.removeChannel(channel);
    clearTimeout(timeout);
  };
}, [shouldListenForUpdates, refetch]);
```

**❌ NEVER use:**
- `setInterval` for polling
- Frequent refetches without conditions
- Polling without fallback timeout

### 2.4 Query Caching

**✅ ALWAYS set appropriate cache times:**

```typescript
// For frequently accessed data
const { data } = trpc.tags.list.useQuery(undefined, {
  staleTime: 60_000,    // Don't refetch for 1 minute
  gcTime: 300_000,      // Keep in cache for 5 minutes
});

// For rarely changing data
const { data } = trpc.categories.list.useQuery(undefined, {
  staleTime: 300_000,   // Don't refetch for 5 minutes
  gcTime: 600_000,      // Keep in cache for 10 minutes
});
```

---

## 3. TypeScript Standards

### 3.1 Type Safety (CRITICAL)

**✅ ALWAYS use proper types:**

```typescript
// ✅ CORRECT - Use RouterOutputs for API types
import type { RouterOutputs } from "@Faworra/api/trpc/routers/_app";

type EnrichedItem = RouterOutputs["features"]["enrichedList"]["items"][number];
type Stats = RouterOutputs["features"]["stats"];

// ✅ CORRECT - Type mutation variables
const mutation = trpc.features.update.useMutation({
  async onMutate(variables) {
    type UpdateVars = { featureIds: string[]; updates: Record<string, unknown> };
    const vars = variables as UpdateVars;
    // ...
  },
});

// ✅ CORRECT - Type function parameters
const applyFilters = (filters: Record<string, unknown>) => {
  const type = filters.type as string | null;
  const statuses = filters.statuses as string[] | null;
  // ...
};
```

**❌ NEVER use:**
- `any` type (use `unknown` if truly unknown)
- `as any` casting
- Untyped function parameters
- Untyped mutation variables

### 3.2 Strict Mode Compliance

**Required tsconfig settings:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**✅ Handle nulls properly:**
```typescript
// ✅ CORRECT
const name = user?.name ?? "Unknown";
const items = data?.items || [];

// ❌ WRONG
const name = user.name; // Might be undefined
```

---

## 4. Component Organization

### 4.1 Component Size Limits

**Maximum lines per file:**
- Main view component: 300 lines
- Column definitions: 200 lines
- Custom hooks: 150 lines
- Cell components: 100 lines

**If exceeding limits, extract:**
- Complex cells → separate component files
- Filter logic → custom hook
- Mutation logic → custom hook
- Table rendering → separate component

### 4.2 Custom Hooks (REQUIRED)

**✅ ALWAYS create these hooks:**

```typescript
// 1. Invalidation hook (shared across mutations)
export function useFeatureInvalidation() {
  const utils = trpc.useUtils();
  
  return useCallback(async () => {
    await Promise.all([
      utils.features.list.invalidate(),
      utils.features.enrichedList.invalidate(),
      utils.features.stats.invalidate(),
    ]);
  }, [utils]);
}

// 2. Filter hook (centralized filter logic)
export function useFeatureFilters(columnVisibility?: Record<string, boolean>) {
  const [filters, setFilters] = useQueryStates({
    type: parseAsString,
    statuses: parseAsArrayOf(parseAsString),
    // ...
  }, { shallow: true });
  
  const enrichedInput = useMemo(() => {
    // Transform filters for API
  }, [filters]);
  
  const hasActiveFilters = useMemo(() => {
    // Check if any filters active
  }, [filters]);
  
  return {
    filters,
    enrichedInput,
    hasActiveFilters,
    setFilters,
    clearAllFilters: () => setFilters({ /* reset */ }),
  };
}

// 3. Keyboard navigation hook (reusable)
export function useKeyboardNavigation<T>({
  items,
  getId,
  onSelect,
  selectedIds,
}: UseKeyboardNavigationProps<T>) {
  // Arrow keys, space, shift+space logic
  // Return focusedIndex, handleKeyDown
}
```

### 4.3 Component Extraction

**✅ Extract complex cells:**

```typescript
// ❌ WRONG - Inline complex logic
{
  id: "tags",
  cell: ({ row }) => (
    <div>
      {/* 100+ lines of tag editing logic */}
    </div>
  ),
}

// ✅ CORRECT - Extract to component
{
  id: "tags",
  cell: ({ row }) => (
    <TagsCell 
      itemId={row.original.id} 
      initialTags={row.original.tags} 
    />
  ),
}
```

---

## 5. Data Fetching

### 5.1 Infinite Scroll Pattern

**✅ ALWAYS implement properly:**

```typescript
const { ref: loadMoreRef, inView: loadMoreInView } = useInView({ 
  rootMargin: "200px" 
});

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = 
  useSuspenseInfiniteQuery({
    // ... config
  });

useEffect(() => {
  if (loadMoreInView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
}, [loadMoreInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

// Render sentinel
<div ref={loadMoreRef} />
```

### 5.2 Optimistic Updates

**✅ ALWAYS implement for mutations:**

```typescript
const mutation = trpc.features.update.useMutation({
  async onMutate(variables) {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ["features.list"] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(["features.list"]);
    
    // Optimistically update
    if (previous) {
      queryClient.setQueryData(["features.list"], (old) => {
        // Update logic
      });
    }
    
    return { previous };
  },
  onError: (_err, _vars, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData(["features.list"], context.previous);
    }
  },
  onSettled: async () => {
    // Refetch to ensure consistency
    await invalidateFeatures();
  },
});
```

---

## 6. State Management

### 6.1 URL State for Filters

**✅ ALWAYS use nuqs for filters:**

```typescript
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";

const [filters, setFilters] = useQueryStates({
  type: parseAsString,
  statuses: parseAsArrayOf(parseAsString),
  search: parseAsString,
  // ...
}, { shallow: true });
```

**Benefits:**
- Shareable URLs
- Browser back/forward works
- Persists across refreshes

### 6.2 Local State for UI

**✅ Use useState for:**
- Row selection
- Column visibility
- Focused index
- Dialog open/close

**❌ Don't use URL state for:**
- Temporary UI state
- Selection state
- Modal visibility

### 6.3 Persist Column Visibility

**✅ ALWAYS persist to localStorage:**

```typescript
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
  try {
    const raw = typeof window !== "undefined" 
      ? localStorage.getItem("featuresColumns") 
      : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
});

useEffect(() => {
  try {
    localStorage.setItem("featuresColumns", JSON.stringify(columnVisibility));
  } catch {}
}, [columnVisibility]);
```

---

## 7. UI/UX Patterns

### 7.1 Keyboard Navigation (REQUIRED)

**✅ ALWAYS implement:**
- Arrow Up/Down: Navigate rows
- Home/End: Jump to first/last
- Space: Toggle selection
- Shift+Space: Range selection
- Enter: Open details

**Integration with virtualization:**
```typescript
if (e.key === "ArrowDown") {
  e.preventDefault();
  const newIndex = Math.min(focusedIndex + 1, rows.length - 1);
  setFocusedIndex(newIndex);
  
  // Scroll to focused row if virtualized
  if (tableData.length > 50) {
    rowVirtualizer.scrollToIndex(newIndex, { align: 'center' });
  }
}
```

### 7.2 Loading States

**✅ ALWAYS show:**
- Initial load: Suspense boundary handles
- Refetching: Subtle top bar indicator
- Infinite scroll: Loading at bottom
- Mutations: Button loading state

```typescript
{isFetching && !isFetchingNextPage && (
  <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary/70 animate-pulse z-20" />
)}
```

### 7.3 Empty States

**✅ ALWAYS provide:**
- No data: Helpful message + action
- No results: Clear filters action
- Error state: Retry action

```typescript
{!rows.length ? (
  hasActiveFilters ? (
    <EmptyState
      title="No results"
      description="Try adjusting your filters."
      action={{ label: "Clear filters", onClick: clearAllFilters }}
    />
  ) : (
    <EmptyState
      title="No items yet"
      description="Get started by creating your first item."
      action={{ label: "Create item", onClick: openCreateDialog }}
    />
  )
) : (
  // Table
)}
```

### 7.4 Sticky Columns

**✅ Use CSS for sticky columns:**

```css
.sticky-column {
  position: sticky;
  left: 0;
  z-index: 10;
  background: var(--background);
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--background);
}
```

**Z-index hierarchy:**
- Sticky header: z-20
- Loading indicator: z-20
- Sticky columns: z-10
- Regular content: z-0

---

## 8. Testing Checklist

### Before Committing

**Performance:**
- [ ] Initial load < 400ms
- [ ] 1000 rows render < 100ms
- [ ] Smooth scrolling (60fps)
- [ ] No memory leaks

**Functionality:**
- [ ] Infinite scroll works
- [ ] Filters apply correctly
- [ ] Selection works (single, range, all)
- [ ] Keyboard navigation works
- [ ] Mutations update optimistically
- [ ] Real-time updates arrive

**Type Safety:**
- [ ] No `any` types
- [ ] `bun run typecheck` passes
- [ ] No unused variables
- [ ] Proper null handling

**Code Quality:**
- [ ] No files > 300 lines
- [ ] Custom hooks extracted
- [ ] No duplicate logic
- [ ] `bun run lint` passes

**UX:**
- [ ] Loading states visible
- [ ] Empty states helpful
- [ ] Error states actionable
- [ ] Keyboard accessible

---

## 9. Common Mistakes to Avoid

### ❌ Don't Do This:

```typescript
// ❌ Using regular useInfiniteQuery
const { data } = trpc.features.list.useInfiniteQuery(/* ... */);

// ❌ Polling instead of real-time
setInterval(() => refetch(), 3000);

// ❌ No virtualization for large lists
{rows.map((row) => <TableRow />)} // All 10,000 rows!

// ❌ Using `any` types
const handleUpdate = (data: any) => { /* ... */ };

// ❌ Duplicate invalidation
onSuccess: async () => {
  await utils.features.list.invalidate();
  await utils.features.enrichedList.invalidate();
  // Repeated in 5 different mutations!
}

// ❌ No optimistic updates
const mutation = trpc.features.update.useMutation({
  onSuccess: () => refetch(), // Slow!
});

// ❌ Inline complex logic
{
  cell: ({ row }) => (
    <div>
      {/* 200 lines of complex logic */}
    </div>
  ),
}
```

### ✅ Do This Instead:

```typescript
// ✅ Use useSuspenseInfiniteQuery
const { data } = useSuspenseInfiniteQuery(/* ... */);

// ✅ Use real-time subscriptions
supabase.channel('updates').on('postgres_changes', /* ... */);

// ✅ Virtualize large lists
const rowVirtualizer = useVirtualizer({ count: rows.length });

// ✅ Proper types
const handleUpdate = (data: UpdateData) => { /* ... */ };

// ✅ Shared invalidation hook
const invalidateFeatures = useFeatureInvalidation();
onSuccess: () => invalidateFeatures();

// ✅ Optimistic updates
onMutate: async (vars) => {
  await queryClient.cancelQueries();
  const previous = queryClient.getQueryData();
  queryClient.setQueryData(/* optimistic update */);
  return { previous };
};

// ✅ Extract complex cells
<ComplexCell itemId={row.id} initialData={row.data} />
```

---

## 10. Quick Reference

### File Structure Template

```typescript
// page.tsx (Server Component)
export default async function FeaturePage() {
  const teamId = await getCurrentTeamId();
  const data = await getFeatures(db, { teamId, limit: 50 });
  return <FeatureView initialData={data} />;
}

// feature-view.tsx (Client Component)
"use client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useFeatureFilters } from "../_hooks/use-feature-filters";
import { useFeatureInvalidation } from "../_hooks/use-feature-invalidation";

export function FeatureView({ initialData = [] }) {
  const { enrichedInput, hasActiveFilters, clearAllFilters } = useFeatureFilters();
  const invalidateFeatures = useFeatureInvalidation();
  
  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
    queryKey: ["features.list", enrichedInput],
    queryFn: async ({ pageParam }) => { /* ... */ },
    initialData: initialData.length > 0 ? { /* ... */ } : undefined,
  });
  
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    enabled: items.length > 50,
  });
  
  // Render table with virtualization
}
```

### Import Checklist

```typescript
// ✅ Required imports for data tables
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInView } from "react-intersection-observer";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { createBrowserClient } from "@Faworra/supabase/client";
import type { RouterOutputs } from "@Faworra/api/trpc/routers/_app";
```

---

## 11. Performance Benchmarks

### Target Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load | < 400ms | Time to interactive |
| 1000 Rows Render | < 100ms | React DevTools Profiler |
| Scroll FPS | 60fps | Chrome DevTools Performance |
| Memory (1000 rows) | < 50MB | Chrome Task Manager |
| API Calls (idle) | 0/min | Network tab |
| Bundle Size Impact | < 50KB | Webpack Bundle Analyzer |

### How to Measure

```bash
# Type check
bun run typecheck

# Build and check bundle size
bun run build
# Check .next/analyze for bundle impact

# Performance testing
# 1. Open Chrome DevTools
# 2. Performance tab → Record
# 3. Scroll through 1000 rows
# 4. Check FPS and memory
```

---

## 12. Migration Checklist

### Converting Existing Table to New Pattern

- [ ] Create custom hooks (invalidation, filters, keyboard)
- [ ] Switch to useSuspenseInfiniteQuery
- [ ] Add table virtualization (if > 50 rows)
- [ ] Replace polling with real-time
- [ ] Fix all `any` types
- [ ] Extract complex cells
- [ ] Add optimistic updates
- [ ] Implement keyboard navigation
- [ ] Add proper loading states
- [ ] Test with large dataset
- [ ] Verify performance benchmarks

---

## 📚 Additional Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [TanStack Virtual Docs](https://tanstack.com/virtual/latest)
- [TanStack Table Docs](https://tanstack.com/table/latest)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [nuqs Documentation](https://nuqs.47ng.com/)

---

## ✅ Summary

**Follow these guidelines to:**
1. Build performant tables from the start
2. Maintain consistent patterns across features
3. Avoid common pitfalls and anti-patterns
4. Ensure type safety and code quality
5. Create maintainable, testable code

**Key Principles:**
- Server Component → Client Component with initialData
- useSuspenseInfiniteQuery for all lists
- Virtualization for 50+ rows
- Real-time instead of polling
- Custom hooks for reusable logic
- Strict TypeScript compliance
- Optimistic updates for mutations

**Remember:** It's easier to build it right the first time than to refactor later!