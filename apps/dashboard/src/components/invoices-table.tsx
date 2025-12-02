"use client";

import { createColumns, type InvoiceColumn } from "@/app/(dashboard)/invoices/columns";
import { DataTable } from "@/components/data-table";
import type { VisibilityState } from "@tanstack/react-table";
import type { InvoiceWithOrder } from "@/lib/supabase-queries";

interface InvoicesTableProps {
  invoices: InvoiceWithOrder[];
  isLoading?: boolean;
  onMarkAsPaid?: (invoice: InvoiceColumn) => void;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (v: VisibilityState) => void;
  rightToolbar?: React.ReactNode;
  leftToolbar?: React.ReactNode;
  enableRowSelection?: boolean;
  onRowsSelectedChange?: (rows: InvoiceWithOrder[]) => void;
  clearSelectionKey?: number;
}

export function InvoicesTable({
  invoices,
  isLoading,
  onMarkAsPaid,
  searchValue,
  onSearchChange,
  columnVisibility,
  onColumnVisibilityChange,
  rightToolbar,
  leftToolbar,
  enableRowSelection = false,
  onRowsSelectedChange,
  clearSelectionKey,
}: InvoicesTableProps) {
  const columns = createColumns({ onMarkAsPaid });

  return (
    <DataTable
      columns={columns}
      data={invoices}
      isLoading={isLoading}
      searchKey="invoice_number"
      searchPlaceholder="Search invoices by number..."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={onColumnVisibilityChange}
      rightToolbar={rightToolbar}
      leftToolbar={leftToolbar}
      enableRowSelection={enableRowSelection}
      onRowsSelectedChange={onRowsSelectedChange}
      clearSelectionKey={clearSelectionKey}
    />
  );
}
