"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchKey?: string;
  searchPlaceholder?: string;
  enableRowSelection?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (state: VisibilityState) => void;
  leftToolbar?: React.ReactNode;
  rightToolbar?: React.ReactNode;
  onRowsSelectedChange?: (rows: TData[]) => void;
  clearSelectionKey?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  searchKey,
  searchPlaceholder = "Search...",
  enableRowSelection = false,
  searchValue,
  onSearchChange,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  leftToolbar,
  rightToolbar,
  onRowsSelectedChange,
  clearSelectionKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [uncontrolledColumnVisibility, setUncontrolledColumnVisibility] =
    useState<VisibilityState>({});

  const effectiveColumnVisibility = controlledColumnVisibility ?? uncontrolledColumnVisibility;
  const handleColumnVisibilityChange = (updater: any) => {
    const current = effectiveColumnVisibility;
    const next = typeof updater === "function" ? updater(current) : updater;
    (onColumnVisibilityChange ?? setUncontrolledColumnVisibility)(next);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    onColumnVisibilityChange: handleColumnVisibilityChange as any,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    state: {
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility: effectiveColumnVisibility,
    },
  });

  // Keep table filter in sync with external search value (URL state)
  useEffect(() => {
    if (!searchKey) return;
    if (searchValue === undefined) return;
    table.getColumn(searchKey)?.setFilterValue(searchValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey, searchValue]);

  // Expose selected rows to parent
  useEffect(() => {
    if (!onRowsSelectedChange) return;
    const selected = table.getSelectedRowModel().rows.map((r) => r.original as TData);
    onRowsSelectedChange(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  // Clear selection when key changes (imperative reset from parent)
  useEffect(() => {
    if (clearSelectionKey === undefined) return;
    setRowSelection({});
  }, [clearSelectionKey]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {searchKey && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-[300px]" />
          </div>
        )}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={`header-skeleton-${String((col as any)?.id ?? (col as any)?.header ?? "col")}`}
                  >
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"].map((rowKey) => (
                <TableRow key={`row-skeleton-${rowKey}`}>
                  {columns.map((col) => (
                    <TableCell
                      key={`cell-skeleton-${rowKey}-${String((col as any)?.id ?? (col as any)?.header ?? "col")}`}
                    >
                      <Skeleton className="h-4" style={{ width: `${Math.random() * 60 + 40}%` }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-[150px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[80px]" />
            <Skeleton className="h-9 w-[80px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="space-y-4">
        {searchKey && (
          <div className="flex items-center">
            <Input className="max-w-sm" disabled placeholder={searchPlaceholder} />
          </div>
        )}
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-10 w-10 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>No data</title>
                <path
                  d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3a3.75 3.75 0 017.5 0h3A2.25 2.25 0 0121.75 6v3.776"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3 className="mt-6 font-semibold text-lg">No data found</h3>
            <p className="mt-2 text-muted-foreground text-sm">
              Get started by creating your first entry
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(searchKey || leftToolbar || rightToolbar) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">{leftToolbar}</div>
          <div className="flex items-center gap-2">
            {searchKey && (
              <Input
                className="max-w-sm"
                onChange={(event) => {
                  const v = event.target.value;
                  table.getColumn(searchKey)?.setFilterValue(v);
                  onSearchChange?.(v);
                }}
                placeholder={searchPlaceholder}
                value={
                  searchValue ?? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")
                }
              />
            )}
            {rightToolbar}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead className="font-semibold" key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-32 text-center" colSpan={columns.length}>
                  <div className="text-muted-foreground">
                    <p className="font-medium text-sm">No results found</p>
                    <p className="mt-1 text-xs">Try adjusting your search</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-muted-foreground text-sm">
          {enableRowSelection && table.getFilteredSelectedRowModel().rows.length > 0 ? (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </span>
          ) : (
            <span>{table.getFilteredRowModel().rows.length} row(s) total.</span>
          )}
        </div>
        <Button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          size="sm"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size="sm"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
