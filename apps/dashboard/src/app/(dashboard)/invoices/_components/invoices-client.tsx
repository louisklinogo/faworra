"use client";

import { useEffect, useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import { ColumnVisibility } from "@/components/column-visibility";
import { EmptyState } from "@/components/empty-state";
import { InvoiceSheet } from "@/components/invoice-sheet";
import { InvoicesTable } from "@/components/invoices-table";
import { trpc } from "@/lib/trpc/client";
import type { InvoiceWithOrder } from "@/lib/supabase-queries";
import { useInvoicesFilters } from "../_hooks/use-invoices-filters";
import { useInvoiceParams } from "@/hooks/use-invoice-params";

type Props = {
  invoices: InvoiceWithOrder[];
};

const STORAGE_KEY = "invoicesColumns";

export function InvoicesClient({ invoices }: Props) {
  const { q, setQ, statuses, setStatuses } = useInvoicesFilters();
  const { openCreate } = useInvoiceParams();
  const [rows, setRows] = useState<InvoiceWithOrder[]>(invoices);
  useEffect(() => {
    setRows(invoices);
  }, [invoices]);

  // Column visibility with persistence
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? (JSON.parse(raw) as VisibilityState) : {};
    } catch {
      return {} as VisibilityState;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
    } catch {}
  }, [columnVisibility]);

  const toggleColumn = (id: string) => {
    setColumnVisibility((prev) => ({ ...prev, [id]: !(prev as any)[id] }));
  };

  const columnsConfig = useMemo(
    () => [
      { id: "invoice_number", label: "Invoice #", visible: columnVisibility.invoice_number !== false },
      { id: "order", label: "Order / Client", visible: columnVisibility.order !== false },
      { id: "status", label: "Status", visible: columnVisibility.status !== false },
      { id: "amount", label: "Amount", visible: columnVisibility.amount !== false },
      { id: "created_at", label: "Created", visible: columnVisibility.created_at !== false },
    ],
    [columnVisibility],
  );

  // Selection and bulk actions
  const [selected, setSelected] = useState<InvoiceWithOrder[]>([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const deleteMutation = trpc.invoices.delete.useMutation();

  const handleBulkDelete = async () => {
    const deletable = selected.filter((i) => String(i.status) === "draft");
    for (const inv of deletable) {
      try {
        await deleteMutation.mutateAsync({ id: inv.id });
      } catch {
        // ignore errors per item
      }
    }
    const deletedIds = new Set(deletable.map((i) => i.id));
    setRows((prev) => prev.filter((r) => !deletedIds.has(r.id)));
    setSelected([]);
    setClearSelectionKey((k) => k + 1);
  };

  const handleBulkCopy = () => {
    const text = selected.map((i) => i.invoice_number).join("\n");
    try {
      navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleBulkExport = () => {
    if (selected.length === 0) return;
    const rows = selected.map((inv) => ({
      invoice_number: inv.invoice_number,
      client: (inv as any).order?.client?.name || "",
      amount: inv.amount,
      status: String(inv.status),
      issued_at: inv.created_at,
      due_at: inv.due_at ?? "",
      paid_at: inv.paid_at ?? "",
    }));
    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${selected.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Empty/No-results states aligned with Faworra patterns
  const statusesFilteredRows = useMemo(() => {
    if (!statuses.length) return rows;
    const target = new Set(statuses.map((s) => s.toLowerCase()));
    return rows.filter((row) => target.has(String(row.status ?? "").toLowerCase()));
  }, [rows, statuses]);

  const search = (q || "").trim();
  const matches = useMemo(() => {
    if (!search) return statusesFilteredRows;
    const s = search.toLowerCase();
    return statusesFilteredRows.filter((r) => (r.invoice_number || "").toLowerCase().includes(s));
  }, [statusesFilteredRows, search]);

  const hasAnyOverall = rows.length > 0;
  const hasAnyAfterStatus = statusesFilteredRows.length > 0;

  if (!hasAnyOverall && !search && statuses.length === 0) {
    return (
      <>
        <EmptyState
          action={{ label: "Create invoice", onClick: () => openCreate() }}
          description={
            <>
              You haven't created any invoices yet. <br /> Go ahead and create your first one.
            </>
          }
          title="No invoices"
        />
        <InvoiceSheet />
      </>
    );
  }

  if (!hasAnyAfterStatus && statuses.length > 0) {
    return (
      <>
        <EmptyState
          action={{ label: "Clear filters", onClick: () => setStatuses(null) }}
          description="Try a different status filter"
          title="No invoices in this view"
        />
        <InvoiceSheet />
      </>
    );
  }

  if (hasAnyAfterStatus && search && matches.length === 0) {
    return (
      <>
        <EmptyState
          action={{ label: "Clear filters", onClick: () => setQ(null) }}
          description="Try another search, or adjusting the filters"
          title="No results"
        />
        <InvoiceSheet />
      </>
    );
  }

  return (
    <>
      <InvoicesTable
        invoices={matches}
        isLoading={false}
        searchValue={q}
        onSearchChange={(v) => setQ(v || null)}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        rightToolbar={<ColumnVisibility columns={columnsConfig} onToggle={toggleColumn} />}
        enableRowSelection
        onRowsSelectedChange={setSelected}
        clearSelectionKey={clearSelectionKey}
      />

      <InvoiceSheet />

      <BulkActionsBar
        onClear={() => setClearSelectionKey((k) => k + 1)}
        onCopy={handleBulkCopy}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        selectedCount={selected.length}
      />
    </>
  );
}
