"use client";

import { Check, MoreHorizontal, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTeamCurrency } from "@/hooks/use-team-currency";
import { trpc } from "@/lib/trpc/client";
import { VariantSheet } from "./variant-sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteVariantDialog } from "./delete-variant-dialog";

type Props = {
  productId: string;
  variants: any[];
};

export function VariantsTab({ productId, variants }: Props) {
  const currency = useTeamCurrency();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<{ id: string; name?: string | null; sku?: string | null } | null>(null);
  const utils = trpc.useUtils();

  // Local UI state
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");
  const [sort, setSort] = useState<"updated" | "price" | "sku">("updated");
  const [editPriceId, setEditPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>("");

  const updateVariant = trpc.products.variantUpdate.useMutation({
    onSuccess: async () => {
      await utils.products.details.invalidate({ id: productId });
    },
  });

  const counts = useMemo(() => {
    const c = { active: 0, draft: 0, archived: 0 } as Record<string, number>;
    for (const v of variants || []) c[v.status] = (c[v.status] || 0) + 1;
    return c;
  }, [variants]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let rows = (variants || []).filter((v) =>
      !ql || `${v.sku || ""} ${v.name || ""}`.toLowerCase().includes(ql),
    );
    if (statusFilter !== "all") rows = rows.filter((v) => v.status === statusFilter);
    rows = [...rows].sort((a, b) => {
      if (sort === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sort === "price") return Number(b.price ?? 0) - Number(a.price ?? 0);
      return String(a.sku || "").localeCompare(String(b.sku || ""));
    });
    return rows;
  }, [variants, q, statusFilter, sort]);

  const proper = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const statusPillClass = (s: string) =>
    ({
      active: "bg-green-100 text-green-700 border-green-200",
      draft: "bg-slate-100 text-slate-700 border-slate-200",
      archived: "bg-red-100 text-red-700 border-red-200",
    }[s] || "bg-muted text-foreground border-muted");

  if (!variants || variants.length === 0) {
    return (
      <>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="mb-2 font-medium">No variants yet</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            Get started by adding your first variant
          </p>
          <Button className="bg-foreground text-background rounded-none" onClick={() => setSheetOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
        <VariantSheet
          onOpenChange={setSheetOpen}
          open={sheetOpen}
          productId={productId}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-lg">Variants</h3>
          <span className={`inline-flex items-center border px-2 py-0.5 text-xs rounded-full ${statusPillClass("active")}`}>Active {counts.active || 0}</span>
          <span className={`inline-flex items-center border px-2 py-0.5 text-xs rounded-full ${statusPillClass("draft")}`}>Draft {counts.draft || 0}</span>
          <span className={`inline-flex items-center border px-2 py-0.5 text-xs rounded-full ${statusPillClass("archived")}`}>Archived {counts.archived || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Input className="h-10 w-[240px] rounded-none" placeholder="Search SKU or name" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-10 w-[150px] rounded-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="h-10 w-[150px] rounded-none">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="sku">SKU</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-foreground text-background rounded-none h-10 px-4" onClick={() => { setEditingVariant(null); setSheetOpen(true); }} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <Table className="min-w-[900px]">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>Name / SKU</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{v.name || "Unnamed"}</span>
                    <span className="text-muted-foreground text-xs">{v.sku || "No SKU"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center border px-2 py-0.5 text-xs rounded-full ${statusPillClass(String(v.status))}`}>{proper(String(v.status))}</span>
                </TableCell>
                <TableCell>
                  {editPriceId === v.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        className="h-8 w-[120px] rounded-none"
                        onChange={(e) => setEditPriceValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = editPriceValue.trim();
                            updateVariant.mutate({ id: v.id, price: val === "" ? null : Number(val) as any });
                            setEditPriceId(null);
                          } else if (e.key === "Escape") {
                            setEditPriceId(null);
                          }
                        }}
                        placeholder="0.00"
                        value={editPriceValue}
                      />
                      <Button className="h-8 rounded-none" onClick={() => { updateVariant.mutate({ id: v.id, price: editPriceValue === "" ? null : Number(editPriceValue) as any }); setEditPriceId(null); }} size="icon" variant="outline">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button className="h-8 rounded-none" onClick={() => setEditPriceId(null)} size="icon" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="text-left"
                      onClick={() => {
                        setEditPriceId(v.id);
                        setEditPriceValue(v.price != null ? String(Number(v.price)) : "");
                      }}
                      type="button"
                    >
                      {v.price != null ? (
                        <>
                          {currency} {Number(v.price).toFixed(2)}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </button>
                  )}
                </TableCell>
                <TableCell>{v.currency || ""}</TableCell>
                <TableCell>{proper(String(v.fulfillmentType || "")) || "-"}</TableCell>
                <TableCell>{new Date(v.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-label="Actions" className="rounded-none" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8}>
                      <DropdownMenuItem onSelect={() => { setEditingVariant(v); setSheetOpen(true); }}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { const next = v.status === "archived" ? "active" : "archived"; updateVariant.mutate({ id: v.id, status: next }); }}>
                        {v.status === "archived" ? "Unarchive" : "Archive"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => {
                          setVariantToDelete({ id: v.id, name: v.name, sku: v.sku });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <VariantSheet
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingVariant(null);
        }}
        open={sheetOpen}
        productId={productId}
        variant={editingVariant}
        variantId={editingVariant?.id}
      />

      {/* Dialogs */}
      <DeleteVariantDialog
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        productId={productId}
        variant={variantToDelete}
      />
    </div>
  );
}
