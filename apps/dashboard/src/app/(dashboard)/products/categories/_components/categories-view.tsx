"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { CategorySheet } from "./category-sheet";

type Category = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  description: string | null;
  parentId: string | null;
  system: boolean;
  children?: Category[];
};

export function CategoriesView({ initialCategories = [] as Category[] }: { initialCategories?: Category[] }) {
  const utils = trpc.useUtils();
  // Data
  const { data: categories = initialCategories } = trpc.productCategories.list.useQuery(undefined, {
    initialData: initialCategories,
    staleTime: 60_000,
  });
  const { data: mappings = [] } = trpc.productCategories.mappings.useQuery();
  const { data: trxCats = [] } = trpc.transactionCategories.list.useQuery();

  // State
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Mutations
  const del = trpc.productCategories.delete.useMutation({
    onSuccess: async () => {
      await utils.productCategories.list.invalidate();
      await utils.productCategories.mappings.invalidate();
    },
  });

  // Helpers
  const flat = useMemo(() => flatten(categories), [categories]);
  const trxMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of flatten(trxCats as any)) map.set((r as any).id, (r as any).name);
    return map;
  }, [trxCats]);
  const mappingNameByProductId = useMemo(() => {
    const m = new Map<string, string>();
    for (const row of mappings as any[]) {
      const name = trxMap.get(row.transactionCategoryId);
      if (name) m.set(row.productCategoryId, name);
    }
    return m;
  }, [mappings, trxMap]);

  const visible = useMemo(() => {
    if (!query.trim()) {
      return flat.filter((r) => r.depth === 0 || r.ancestors.every((a) => expanded.has(a)));
    }
    const q = query.toLowerCase();
    const matches = new Set<string>();
    for (const r of flat) if ((r.name + " " + r.slug).toLowerCase().includes(q)) matches.add(r.id);
    const ancestorIds = new Set<string>();
    for (const r of flat) if (matches.has(r.id)) for (const a of r.ancestors) ancestorIds.add(a);
    return flat.filter((r) => matches.has(r.id) || ancestorIds.has(r.id));
  }, [flat, expanded, query]);

  return (
    <Card className="border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="sr-only">Product Categories</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-none border px-3 py-2 text-sm md:flex">
              <Icons.Search className="h-4 w-4 text-muted-foreground" />
              <Input
                className="h-6 w-[260px] border-none bg-transparent p-0 text-sm focus-visible:ring-0"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories…"
                value={query}
              />
            </div>
            <Button aria-label="Add category" onClick={() => setCreateOpen(true)} size="icon" title="Add category">
              <Icons.Add className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {flat.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-muted-foreground text-sm">No categories yet</div>
            <Button onClick={() => setCreateOpen(true)}>Create</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">Name</TableHead>
                    <TableHead className="sticky top-0 w-[220px] bg-background">Slug</TableHead>
                    <TableHead className="sticky top-0 w-[220px] bg-background">Mapped Tx Category</TableHead>
                    <TableHead className="sticky top-0 w-[120px] bg-background text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => (
                    <TableRow className="cursor-pointer hover:bg-muted/50" key={r.id} onClick={() => setEditId(r.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium text-sm" style={{ paddingLeft: `${r.depth * 16}px` }}>
                          {r.hasChildren ? (
                            <button
                              aria-label={expanded.has(r.id) ? "Collapse" : "Expand"}
                              className="-ml-1 p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggle(expanded, setExpanded, r.id);
                              }}
                              type="button"
                            >
                              {expanded.has(r.id) ? <Icons.ChevronDown size={18} /> : <Icons.ChevronRight size={18} />}
                            </button>
                          ) : (
                            <span className="inline-block w-[18px]" />
                          )}
                          <span className="inline-block h-3 w-3 rounded-sm border" style={{ backgroundColor: (r.color as any) || "transparent" }} title={(r.color as any) || undefined} />
                          <span>{r.name}</span>
                          {r.system ? (
                            <span className="rounded-full border border-border px-2 py-1 font-mono text-[#878787] text-[10px]">System</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.slug}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{mappingNameByProductId.get(r.id) || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-label="Actions" onClick={(e) => e.stopPropagation()} size="icon" variant="ghost">
                              <Icons.MoreHoriz className="size-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => setEditId(r.id)}>Edit</DropdownMenuItem>
                            {!r.system && (
                              <DropdownMenuItem
                                className="text-destructive"
                                disabled={del.isPending}
                                onClick={async () => {
                                  if (window.confirm("Delete this category?")) {
                                    await del.mutateAsync({ id: r.id });
                                  }
                                }}
                              >
                                Remove
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      <CategorySheet
        category={categories.find((c: any) => c.id === editId)}
        onOpenChange={(o) => !o && setEditId(null)}
        onSaved={() => utils.productCategories.list.invalidate()}
        open={!!editId}
        parents={categories}
      />
      <CategorySheet
        category={undefined}
        onOpenChange={setCreateOpen}
        onSaved={() => utils.productCategories.list.invalidate()}
        open={createOpen}
        parents={categories}
      />
    </Card>
  );
}

function flatten(nodes: Category[], depth = 0, ancestors: string[] = []): Array<
  Category & { depth: number; hasChildren: boolean; ancestors: string[] }
> {
  const out: Array<Category & { depth: number; hasChildren: boolean; ancestors: string[] }> = [];
  for (const n of nodes) {
    const children = n.children || [];
    out.push({ ...n, depth, hasChildren: children.length > 0, ancestors });
    if (children.length > 0) out.push(...flatten(children, depth + 1, [...ancestors, n.id]));
  }
  return out;
}

function toggle(expanded: Set<string>, setExpanded: (s: Set<string>) => void, id: string) {
  const next = new Set(expanded);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  setExpanded(next);
}
