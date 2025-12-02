"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  type RowSelectionState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { EmptyState } from "@/components/empty-state";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { SearchInline } from "@/components/search-inline";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Download, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductParams } from "@/hooks/use-product-params";
import { useTeamCurrency } from "@/hooks/use-team-currency";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { TransactionsColumnVisibility } from "@/components/transactions-column-visibility";
import { ProductDetailsSheet } from "./product-details-sheet";
import { ProductSheet } from "./product-sheet";
import { createProductColumns, type ProductRow } from "./products-columns";
import { ProductsFilterDropdown } from "./products-filter-dropdown";
import { ProductsAnalyticsCarousel } from "./products-analytics-carousel";

type Props = {
  initialData?: ProductRow[];
  initialStats?: {
    totalProducts: number;
    activeProducts: number;
    draftProducts: number;
    archivedProducts: number;
    lowStockVariants: number;
    outOfStockVariants: number;
  };
  initialTopCategories?: Array<{ slug: string; name: string; color?: string | null; total: number }>;
};

export function ProductsView({ initialData = [], initialStats, initialTopCategories }: Props) {
  const currency = useTeamCurrency();
  const utils = trpc.useUtils();
  const { open } = useProductParams();
  const { toast } = useToast();

  const { data: categories = [] } = trpc.productCategories.list.useQuery();

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast({ description: "Product deleted" });
      void Promise.all([
        utils.products.list.invalidate(),
        utils.products.stats.invalidate(),
        utils.products.topCategories.invalidate(),
      ]);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to delete product",
      });
    },
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast({ description: "Product updated" });
      void Promise.all([
        utils.products.list.invalidate(),
        utils.products.stats.invalidate(),
        utils.products.topCategories.invalidate(),
      ]);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to update product",
      });
    },
  });

  const duplicateMutation = trpc.products.duplicate.useMutation({
    onSuccess: (res) => {
      toast({ description: "Product duplicated" });
      void Promise.all([
        utils.products.list.invalidate(),
        utils.products.stats.invalidate(),
        utils.products.topCategories.invalidate(),
      ]);
      if (res?.id) open({ productId: res.id });
    },
    onError: (error) => {
      toast({ variant: "destructive", description: error.message || "Failed to duplicate" });
    },
  });

  const [{ q, statuses, category }, setFilters] = useQueryStates(
    {
      q: parseAsString,
      statuses: parseAsArrayOf(parseAsString),
      category: parseAsString,
    },
    { shallow: true },
  );

  const {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    error,
    refetch,
  } = trpc.products.list.useInfiniteQuery(
    {
      search: q || undefined,
      status:
        Array.isArray(statuses) && statuses.length
          ? (statuses as ("active" | "draft" | "archived")[])
          : undefined,
      categorySlug: category || undefined,
      limit: 50,
    } as any,
    {
      getNextPageParam: (last) => (last as any)?.nextCursor ?? null,
      initialData:
        initialData && initialData.length > 0
          ? {
              pages: [{ items: initialData, nextCursor: null }],
              pageParams: [null],
            }
          : undefined,
      staleTime: 30_000,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  const rows: ProductRow[] = useMemo(
    () => (pages?.pages || []).flatMap((p: any) => p.items || []),
    [pages],
  );

  // Row selection + column visibility state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("productsColumns") : null;
      return raw ? (JSON.parse(raw) as VisibilityState) : {};
    } catch {
      return {} as VisibilityState;
    }
  });
  const selectedIds = useMemo(
    () => new Set(Object.keys(rowSelection).filter((k) => (rowSelection as any)[k])),
    [rowSelection],
  );
  const selectedCount = selectedIds.size;

  const columns = useMemo(
    () =>
      createProductColumns({
        currencyCode: currency,
        onEdit: (row) => {
          open({ productId: row.product.id });
          void utils.products.details.prefetch({ id: row.product.id });
        },
        onDuplicate: async (row) => {
          duplicateMutation.mutate({ id: row.product.id });
        },
        onArchive: (row) => {
          const newStatus = row.product.status === "archived" ? "active" : "archived";
          updateMutation.mutate({
            id: row.product.id,
            status: newStatus,
          } as any);
        },
        onDelete: (row) => {
          if (confirm(`Delete "${row.product.name}"? This cannot be undone.`)) {
            deleteMutation.mutate({ id: row.product.id });
          }
        },
        categories,
      }),
    [currency, utils, open, categories, updateMutation, deleteMutation, toast, duplicateMutation],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { rowSelection, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.product.id,
  });

  // Persist column visibility
  useEffect(() => {
    try {
      localStorage.setItem("productsColumns", JSON.stringify(columnVisibility));
    } catch {}
  }, [columnVisibility]);

  const containerRef = useRef<HTMLDivElement>(null);
  const useVirtual = rows.length > 50;
  const v = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 60,
    overscan: 10,
    enabled: useVirtual,
  });

  const virtualItems = useVirtual
    ? v.getVirtualItems()
    : (rows.map((_, i) => ({ index: i })) as Array<{
        index: number;
        start?: number;
        end?: number;
      }>);
  const totalSize = v.getTotalSize();
  const paddingTop = useVirtual && virtualItems.length ? virtualItems[0]!.start || 0 : 0;
  const paddingBottom =
    useVirtual && virtualItems.length
      ? totalSize - (virtualItems[virtualItems.length - 1]!.end || 0)
      : 0;

  const { ref: loadMoreRef, inView } = useInView({ rootMargin: "200px" });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Filters active?
  const hasActiveFilters = useMemo(
    () => Boolean(q) || Boolean(category) || (Array.isArray(statuses) && statuses.length > 0),
    [q, category, statuses],
  );

  const clearAllFilters = () => {
    setFilters({ q: null, statuses: null, category: null });
  };

  // Export selected to CSV
  const exportSelected = () => {
    if (selectedCount === 0) return;
    const selected = rows.filter((r) => selectedIds.has(r.product.id));
    if (selected.length === 0) return;
    const out = selected.map((r) => ({
      id: r.product.id,
      name: r.product.name,
      status: r.product.status,
      type: r.product.type,
      category: r.product.categorySlug ?? "",
      variants: r.variantsCount,
      price_min: r.priceMin ?? "",
      price_max: r.priceMax ?? "",
      stock_on_hand: r.stockOnHand,
      stock_allocated: r.stockAllocated,
    }));
    const headers = Object.keys(out[0] || {});
    const csv = [
      headers.join(","),
      ...out.map((row) => headers.map((h) => JSON.stringify((row as any)[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_${selected.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete selected (soft delete, sequential)
  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} product(s)? This cannot be undone.`)) return;
    for (const id of ids) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await deleteMutation.mutateAsync({ id });
      } catch {
        // individual errors already toasted
      }
    }
    setRowSelection({});
  };

  // Keyboard navigation (basic)
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  useEffect(() => {
    if (rows.length === 0) setFocusedIndex(0);
    else if (focusedIndex > rows.length - 1) setFocusedIndex(rows.length - 1);
  }, [rows.length, focusedIndex]);

  return (
    <div className="flex flex-col gap-6">
      <ProductsAnalyticsCarousel initialStats={initialStats} initialTopCategories={initialTopCategories} />
      {/* Sticky toolbar (desktop) */}
      {/* Mobile bulk bar */}
      {selectedCount > 0 && (
        <div className="mb-2 flex items-center justify-between border-b bg-muted/40 px-4 py-3 sm:hidden">
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm">Bulk edit</span>
            <div className="h-4 w-px bg-border" />
            <span className="text-muted-foreground text-sm">{selectedCount} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button className="gap-1" onClick={exportSelected} size="sm" variant="outline">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button className="gap-1" onClick={deleteSelected} size="sm" variant="ghost">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 hidden grid-cols-[420px,1fr,auto] items-center gap-2 rounded bg-background/95 px-1 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:grid">
        {/* Left: selection summary */}
        <div className="min-w-0">
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{selectedCount} selected</span>
              <Button className="gap-1" onClick={exportSelected} size="sm" variant="outline">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button className="gap-1" onClick={deleteSelected} size="sm" variant="ghost">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={() => setRowSelection({})} size="sm" variant="ghost">
                Clear
              </Button>
            </div>
          ) : (
            <div className="pointer-events-none h-9 select-none opacity-0" />
          )}
        </div>

        {/* Middle spacer */}
        <div className="min-w-0" />

        {/* Right: controls */}
        <div className="flex items-center justify-end gap-2">
          <SearchInline />
          <ProductsFilterDropdown
            onChange={(n) => {
              setFilters({
                statuses: (n.statuses as any) ?? null,
                category: (n.category as any) ?? null,
              });
            }}
            values={{ statuses: (statuses as string[]) ?? [], category: category || undefined }}
          />
          <TransactionsColumnVisibility columns={table.getAllColumns()} />
          {selectedCount === 0 && (
            <Button aria-label="Export" onClick={exportSelected} size="icon" variant="outline">
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button aria-label="Add Product" onClick={() => open()} size="icon">
            <Icons.Add className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chips row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <FilterToolbar
            appearance="chip"
            fields={[
              {
                key: "statuses",
                label: "Status",
                type: "multi",
                options: [
                  { value: "active", label: "Active" },
                  { value: "draft", label: "Draft" },
                  { value: "archived", label: "Archived" },
                ],
              },
              { key: "category", label: "Category", type: "select" },
            ]}
            onChange={(next) => {
              setFilters({
                statuses: (next.statuses as any) ?? null,
                category: (next.category as any) ?? null,
              });
            }}
            values={{ statuses: (statuses as string[]) ?? [], category }}
          />
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button onClick={clearAllFilters} size="sm" variant="ghost">
              Reset
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <EmptyState
          action={{ label: "Retry", onClick: () => refetch() }}
          description="There was a problem loading the list."
          title="Could not load products"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          action={{ label: "Add Product", onClick: () => open() }}
          description="Add your first product to get started."
          title="No products"
        />
      ) : (
        <div
          className="relative max-h-[calc(100vh-400px)] overflow-auto"
          onKeyDown={(e) => {
            if (!rows.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const next = Math.min(focusedIndex + 1, rows.length - 1);
              setFocusedIndex(next);
              if (rows.length > 50) v.scrollToIndex(next, { align: "center" });
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const next = Math.max(focusedIndex - 1, 0);
              setFocusedIndex(next);
              if (rows.length > 50) v.scrollToIndex(next, { align: "center" });
            } else if (e.key === "Home") {
              e.preventDefault();
              setFocusedIndex(0);
              if (rows.length > 50) v.scrollToIndex(0);
            } else if (e.key === "End") {
              e.preventDefault();
              setFocusedIndex(rows.length - 1);
              if (rows.length > 50) v.scrollToIndex(rows.length - 1);
            } else if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              const id = rows[focusedIndex]?.product?.id;
              if (!id) return;
              const isSelected = selectedIds.has(id);
              const next = { ...rowSelection } as Record<string, boolean>;
              if (isSelected) delete next[id];
              else next[id] = true;
              setRowSelection(next);
            }
          }}
          ref={containerRef}
          role="application"
        >
          {isFetching && !isFetchingNextPage ? (
            <div className="absolute top-0 right-0 left-0 z-20 h-0.5 animate-pulse bg-primary/70" />
          ) : null}
          <Table className="min-w-[900px]">
            <TableHeader className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualItems.map((vr: any) => {
                const row = table.getRowModel().rows[vr.index];
                if (!row) return null;
                return (
                  <TableRow
                    className={focusedIndex === vr.index ? "bg-muted/40" : ""}
                    data-state={row.getIsSelected() && "selected"}
                    key={row.id}
                  >
                    {row.getVisibleCells().map((c) => (
                      <TableCell key={c.id}>
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </TableBody>
          </Table>
          <div className="h-8" ref={loadMoreRef} />
        </div>
      )}

      {null}

      {hasNextPage ? (
        <div className="flex justify-center py-4">
          <Button
            disabled={!hasNextPage || isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant="ghost"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}

      <ProductSheet />
      <ProductDetailsSheet />
    </div>
  );
}
