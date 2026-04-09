"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { Table, TableBody } from "@faworra-new/ui/components/table";
import { Tooltip, TooltipProvider } from "@faworra-new/ui/components/tooltip";
import { Spinner } from "@faworra-new/ui/components/spinner";
import { useMutation, useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import type { RouterOutputs } from "@/utils/trpc";
import { VirtualRow } from "@/components/tables/core/virtual-row";
import { useTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTransactionTab } from "@/hooks/use-transaction-tab";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import { useTableDnd } from "@/hooks/use-table-dnd";
import { useTableSettings } from "@/hooks/use-table-settings";
import { useTransactionsStore } from "@/store/transactions";
import { trpc } from "@/utils/trpc";
import { STICKY_COLUMNS } from "@/utils/table-configs";
import { getColumnIds, type TableSettings } from "@/utils/table-settings";
import { BulkEditBar } from "./bulk-edit-bar";
import { ExportBar } from "./export-bar";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";
import { TransactionTableProvider } from "./transaction-table-context";

type Transaction = RouterOutputs["transactions"]["list"]["items"][number];
type TransactionTab = "all" | "review";

// Stable reference for non-clickable columns (avoids recreation on each render)
const NON_CLICKABLE_COLUMNS = new Set([
  "select",
  "actions",
  "category",
]);

const COLUMN_IDS = getColumnIds(columns);

interface DataTableProps {
  /** Initial table settings */
  initialSettings?: Partial<TableSettings>;
  /** Initial tab from URL */
  initialTab?: "all" | "review";
}

export function DataTable({
  initialSettings,
  initialTab,
}: DataTableProps) {
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);

  // Get tab and filter state from URL
  const { tab } = useTransactionTab();
  const { filter, hasFilters } = useTransactionFilterParams();
  const { setParams: setTransactionParams } = useTransactionParams();

  const {
    setRowSelection: setRowSelectionForTab,
    rowSelectionByTab,
    setColumns,
    setCanDelete,
    setTransactionIds,
  } = useTransactionsStore();

  // Use unified table settings hook for column state management
  const {
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
  } = useTableSettings({
    tableId: "transactions",
    initialSettings,
    columnIds: COLUMN_IDS,
  });

  // Use the current tab from URL, falling back to initial value
  const activeTab = (tab ?? initialTab ?? "all") as TransactionTab;
  const isReviewTab = activeTab === "review";

  // Get tab-specific row selection
  const rowSelection = rowSelectionByTab[activeTab] ?? {};
  const setRowSelection = useCallback(
    (updater: Parameters<typeof setRowSelectionForTab>[1]) => {
      setRowSelectionForTab(activeTab, updater);
    },
    [activeTab, setRowSelectionForTab],
  );

  // Build query filters based on active tab
  // Review tab: strict export queue (ignore user filters)
  const queryFilter = useMemo(() => {
    if (isReviewTab) {
      return {
        // Fulfilled = has attachments OR status=completed
        fulfilled: true,
        // Only show transactions not yet exported
        exported: false,
        pageSize: 10000, // Load all for review
      };
    }
    // Map filter params to API schema
    // Note: filter.type -> API expects type (Midday pattern)
    // filter.amount_range -> API expects amountRange
    // filter.accounts -> API expects accounts (same)
    // filter.tags is NOT used by API (tags are for filtering, not a query param)
    return {
      q: filter.q ?? null,
      accounts: filter.accounts ?? null,
      assignees: filter.assignees ?? null,
      attachments: filter.attachments ?? null,
      categories: filter.categories ?? null,
      start: filter.start ?? null,
      end: filter.end ?? null,
      type: filter.type ?? null,
      amountRange: filter.amount_range ?? null,
      recurring: filter.recurring ?? null,
      statuses: filter.statuses ?? null,
      manual: filter.manual ?? null,
      // When filters are active, load all results for analysis/export
      // Otherwise use default pagination for browsing
      pageSize: hasFilters ? 10000 : undefined,
    };
  }, [filter, isReviewTab, hasFilters]);

  const infiniteQueryOptions = trpc.transactions.list.infiniteQueryOptions(
    queryFilter,
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    },
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  // Flatten pages into single array
  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const ids = useMemo(() => {
    return tableData.map((row: Transaction) => row?.id);
  }, [tableData]);

  useEffect(() => {
    setTransactionIds(ids);
  }, [ids, setTransactionIds]);

  // Update transaction mutation
  const updateTransactionMutation = useMutation(
    trpc.transactions.updateMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.reviewCount.queryKey(),
        });
        toast.success("Transaction updated");
      },
      onError: () => {
        toast.error("Failed to update transaction");
      },
    }),
  );

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation(
    trpc.transactions.deleteMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.reviewCount.queryKey(),
        });
        setRowSelection({});
        toast.success("Transaction deleted");
      },
    }),
  );

  // Memoized table meta callbacks for stable references (prevents unnecessary re-renders)
  const setOpen = useCallback(
    (id: string) => {
      setTransactionParams({ editTransaction: null, transactionId: id });
    },
    [setTransactionParams],
  );

  const updateTransaction = useCallback(
    (data: {
      id: string;
      status?: string;
      categorySlug?: string | null;
      categoryName?: string;
      categoryId?: string;
      assignedId?: string | null;
    }) => {
      // Use updateMany with the single ID
      const updateData: {
        ids: string[];
        categoryId?: string | null;
        assignedId?: string | null;
      } = { ids: [data.id] };

      if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId;
      }
      if (data.assignedId !== undefined) {
        updateData.assignedId = data.assignedId;
      }

      if (Object.keys(updateData).length > 1) {
        updateTransactionMutation.mutate(updateData);
      }
    },
    [updateTransactionMutation],
  );

  const onDeleteTransaction = useCallback(
    (id: string) => {
      deleteTransactionMutation.mutate({ ids: [id] });
    },
    [deleteTransactionMutation],
  );

  const editTransaction = useCallback(
    (id: string) => {
      setTransactionParams({ editTransaction: id, transactionId: null });
    },
    [setTransactionParams],
  );

  const copyUrl = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("transactionId", id);
    void navigator.clipboard.writeText(url.toString());
    toast.success("Transaction link copied");
  }, []);

  // Memoize the meta object to prevent table re-renders
  const tableMeta = useMemo(
    () => ({
      setOpen,
      copyUrl,
      updateTransaction,
      onDeleteTransaction,
      editTransaction,
    }),
    [setOpen, copyUrl, updateTransaction, onDeleteTransaction, editTransaction],
  );

  const table = useReactTable({
    getRowId: (row) => row?.id,
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    // Column resizing
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    state: {
      rowSelection,
      columnVisibility,
      columnSizing,
      columnOrder,
    },
    meta: tableMeta,
  });

  // DnD for column reordering
  const { sensors, handleDragEnd } = useTableDnd(table);

  // Use the reusable sticky columns hook
  const { getStickyStyle, getStickyClassName } = useStickyColumns({
    columnVisibility,
    table,
    stickyColumns: STICKY_COLUMNS.transactions,
  });

  const rows = table.getRowModel().rows;

  // Stable cell click handler for VirtualRow
  const handleCellClick = useCallback(
    (rowId: string) => {
      setTransactionParams({ editTransaction: null, transactionId: rowId });
    },
    [setTransactionParams],
  );

  // Row virtualizer for performance
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45, // Row height in pixels
    overscan: 10, // Number of rows to render outside visible area
  });

  useEffect(() => {
    setColumns(table.getAllLeafColumns());
  }, [columnVisibility, setColumns, table]);

  // Determine if selected transactions can be deleted (only manual transactions can be deleted)
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection);

    // No selections means nothing can be deleted
    if (selectedIds.length === 0) {
      setCanDelete(false);
      return;
    }

    // Check if any selected non-manual transaction exists (these cannot be deleted)
    const hasNonManualSelected = selectedIds.some((id) => {
      const transaction = tableData.find((t: Transaction) => t?.id === id);
      return transaction && !transaction.manual;
    });

    // Can delete only if all selected transactions are manual
    setCanDelete(!hasNonManualSelected);
  }, [rowSelection, tableData, setCanDelete]);

  // Infinite scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

      if (scrollBottom < 100 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  // Empty state for review tab
  if (isReviewTab && tableData.length === 0) {
    return (
      <div className="relative h-[calc(100vh-200px)] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-xl font-medium mb-2">All done</h2>
            <p className="text-sm text-muted-foreground">
              Everything is exported. New transactions will appear here when they
              are ready to export.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state for all tab
  if (!isReviewTab && tableData.length === 0) {
    return (
      <div className="relative h-[calc(100vh-200px)] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-xl font-medium mb-2">No transactions</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Connect your bank account to automatically import transactions and
              unlock powerful financial insights.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <TransactionTableProvider>
      <div className="relative">
        <TooltipProvider delayDuration={20}>
          <Tooltip>
            <div className="w-full">
              <div
                ref={parentRef}
                onScroll={handleScroll}
                className="overflow-auto overscroll-none border-l border-r border-b border-border scrollbar-hide"
                style={{
                  height: "calc(100vh - 180px)",
                }}
              >
                <DndContext
                  id="transactions-table-dnd"
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table className="w-full min-w-full">
                    <DataTableHeader table={table} />

                    <TableBody
                      className="border-l-0 border-r-0 block"
                      style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        position: "relative",
                      }}
                    >
                      {virtualItems.map((virtualRow: VirtualItem) => {
                        const row = rows[virtualRow.index];
                        if (!row) return null;

                        return (
                          <VirtualRow
                            key={row.id}
                            row={row}
                            virtualStart={virtualRow.start}
                            rowHeight={45}
                            getStickyStyle={getStickyStyle}
                            getStickyClassName={getStickyClassName}
                            nonClickableColumns={NON_CLICKABLE_COLUMNS}
                            onCellClick={handleCellClick}
                            columnSizing={columnSizing}
                            columnOrder={columnOrder}
                            columnVisibility={columnVisibility}
                            isSelected={rowSelection[row.id] ?? false}
                          />
                        );
                      })}
                    </TableBody>
                  </Table>
                </DndContext>

                {/* Loading indicator for infinite scroll */}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <Spinner size={24} />
                  </div>
                )}
              </div>
            </div>
          </Tooltip>
        </TooltipProvider>

        {/* Show bulk edit bar on "all" tab, export bar on "review" tab */}
        {activeTab === "all" && <BulkEditBar />}
        {activeTab === "review" && ids.length > 0 && (
          <ExportBar
            onExportComplete={() => setRowSelection({})}
            transactionIds={ids}
          />
        )}
      </div>
    </TransactionTableProvider>
  );
}
