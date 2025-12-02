"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { ComboboxDropdown, type ComboboxItem } from "@/components/ui/combobox-dropdown";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useProductParams } from "@/hooks/use-product-params";
import { useTeamCurrency } from "@/hooks/use-team-currency";
import { trpc } from "@/lib/trpc/client";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProductDetailsSheet() {
  const { productId, close } = useProductParams();
  const { toast } = useToast();
  const currency = useTeamCurrency();

  const enabled = Boolean(productId);
  const { data, isLoading } = trpc.products.details.useQuery(
    { id: productId as string },
    { enabled },
  );
  const utils = trpc.useUtils();

  const { data: categories = [] } = trpc.productCategories.list.useQuery();

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: async () => {
      toast({ description: "Product updated" });
      await Promise.all([
        utils.products.details.invalidate({ id: productId as string }),
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

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: async () => {
      toast({ description: "Product deleted" });
      await Promise.all([
        utils.products.list.invalidate(),
        utils.products.stats.invalidate(),
        utils.products.topCategories.invalidate(),
      ]);
      close();
    },
    onError: (error) => {
      toast({ variant: "destructive", description: error.message || "Failed to delete product" });
    },
  });

  const createCategoryMutation = trpc.productCategories.create.useMutation({
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to create category",
      });
    },
  });

  // Local form state for Save/Cancel parity with Transaction sheet
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<"active" | "draft" | "archived">("active");
  const [type, setType] = useState<"physical" | "digital" | "service" | "bundle">("physical");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);

  useEffect(() => {
    if (data?.product) {
      setName(data.product.name || "");
      setDescription(data.product.description || "");
      setStatus(data.product.status as any);
      setType(data.product.type as any);
      setCategorySlug(data.product.categorySlug || null);
    }
  }, [data?.product]);

  const dirty = useMemo(() => {
    if (!data?.product) return false;
    return (
      name !== (data.product.name || "") ||
      (description || "") !== (data.product.description || "") ||
      status !== (data.product.status as any) ||
      type !== (data.product.type as any) ||
      (categorySlug || null) !== (data.product.categorySlug || null)
    );
  }, [name, description, status, type, categorySlug, data?.product]);

  // Derived: price range from variants (active only)
  const { priceMinVal, priceMaxVal } = useMemo(() => {
    const vs = (data?.variants || []).filter((v: any) => v.status === "active");
    const nums = vs
      .map((v: any) => (v.price != null ? Number(v.price) : null))
      .filter((n: any) => Number.isFinite(n)) as number[];
    if (!nums.length) return { priceMinVal: null as number | null, priceMaxVal: null as number | null };
    return { priceMinVal: Math.min(...nums), priceMaxVal: Math.max(...nums) };
  }, [data?.variants]);

  const properCase = (s: string | null | undefined) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const statusChip = (s: string) => {
    const map: Record<string, string> = {
      active: "bg-green-100 text-green-700 border-green-200",
      draft: "bg-slate-100 text-slate-700 border-slate-200",
      archived: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <span className={`inline-flex items-center border px-2 py-0.5 text-xs rounded-full ${map[s] || "bg-muted text-foreground border-muted"}`}>
        {properCase(s)}
      </span>
    );
  };

  const typeChip = (t: string) => {
    const map: Record<string, string> = {
      physical: "bg-blue-100 text-blue-700 border-blue-200",
      digital: "bg-purple-100 text-purple-700 border-purple-200",
      service: "bg-teal-100 text-teal-700 border-teal-200",
      bundle: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return (
      <span className={`inline-flex items-center border px-2 py-0.5 text-xs rounded-full ${map[t] || "bg-muted text-foreground border-muted"}`}>
        {properCase(t)}
      </span>
    );
  };

  const onSave = async () => {
    if (!data?.product || !dirty) return close();
    if (!productId) return close();
    const payload: any = { id: productId };
    if (name !== data.product.name) payload.name = name;
    if ((description || "") !== (data.product.description || "")) payload.description = description || null;
    if (status !== (data.product.status as any)) payload.status = status;
    if (type !== (data.product.type as any)) payload.type = type;
    if ((categorySlug || null) !== (data.product.categorySlug || null)) payload.categorySlug = categorySlug;
    await updateMutation.mutateAsync(payload);
    close();
  };

  return (
    <Sheet onOpenChange={(open) => !open && close()} open={Boolean(productId)}>
      <SheetContent className="bg-background p-0 sm:max-w-[720px]">
        <ScrollArea className="h-full p-6 pb-28">
          {isLoading || !data ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header: title + pills + menu */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-lg leading-6">{data.product.name}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {statusChip(String(data.product.status))}
                    {typeChip(String(data.product.type))}
                    {data.product.categorySlug ? (
                      <span className="inline-flex items-center border px-2 py-0.5 text-xs rounded-full">
                        {data.product.categorySlug}
                      </span>
                    ) : null}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label="More actions" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8}>
                    {data.product.status === "archived" ? (
                      <DropdownMenuItem onClick={() => setStatus("active")}> 
                        <ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => setStatus("archived")}> 
                        <Archive className="mr-2 h-4 w-4" /> Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (!productId) return;
                        if (confirm("Delete this product? This cannot be undone.")) {
                          deleteMutation.mutate({ id: productId });
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Summary grid (3x1 directly under pills) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="border p-3">
                  <div className="text-muted-foreground text-xs">Price range</div>
                  <div className="mt-1 font-medium">
                    {priceMinVal == null && priceMaxVal == null
                      ? "-"
                      : priceMinVal != null && priceMaxVal != null && priceMinVal !== priceMaxVal
                        ? `${currency} ${priceMinVal.toFixed(2)} - ${currency} ${priceMaxVal.toFixed(2)}`
                        : `${currency} ${(priceMinVal ?? priceMaxVal ?? 0).toFixed(2)}`}
                  </div>
                </div>
                <div className="border p-3">
                  <div className="text-muted-foreground text-xs">Variants</div>
                  <div className="mt-1 font-medium">{(data as any).variants?.length || 0}</div>
                </div>
                <div className="border p-3">
                  <div className="text-muted-foreground text-xs">Stock on hand</div>
                  <div className="mt-1 font-medium">0</div>
                </div>
              </div>

              {/* Form sections (sharp fields) */}
              <div className="space-y-4">
                  {/* Basics */}
                  <div className="space-y-2">
                    <label className="font-medium text-sm" htmlFor="prod-name">Product Name</label>
                    <Input className="rounded-none" id="prod-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium text-sm" htmlFor="prod-desc">Description</label>
                    <Textarea className="rounded-none" id="prod-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>

                  {/* Classification */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-medium text-sm">Status</label>
                      <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="font-medium text-sm">Type</label>
                      <Select value={type} onValueChange={(v) => setType(v as any)}>
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical">Physical</SelectItem>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="bundle">Bundle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium text-sm">Category</label>
                    <ComboboxDropdown
                      items={
                        categories.map((c) => ({ id: c.slug, label: c.name })) as ComboboxItem[]
                      }
                      onCreate={async (name) => {
                        const created = await createCategoryMutation.mutateAsync({ name });
                        await utils.productCategories.list.invalidate();
                        setCategorySlug(created.slug);
                      }}
                      onSelect={(item) => setCategorySlug(item?.id || null)}
                      placeholder="Select category"
                      searchPlaceholder="Search or create category..."
                      selectedItem={
                        categorySlug
                          ? {
                              id: categorySlug,
                              label: categories.find((c) => c.slug === categorySlug)?.name || "",
                            }
                          : undefined
                      }
                    />
                  </div>
              </div>

              {/* Variants section (no accordion, no separators) */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm">Variants ({data.variants?.length || 0})</label>
                  <Button
                    asChild
                    className="bg-foreground text-background rounded-none h-7 px-3 hover:bg-foreground/90"
                    disabled={!productId}
                    size="sm"
                    variant="default"
                  >
                    <Link href={productId ? `/products/${productId}?tab=variants` : "#"}>Manage</Link>
                  </Button>
                </div>
                {(data.variants || []).length > 0 ? (
                  <div className="space-y-2">
                    {(data.variants || []).map((v) => (
                      <div className="flex items-center justify-between border p-2 text-sm" key={v.id}>
                        <div className="truncate">
                          <span className="font-medium">{v.name || v.sku || "Unnamed"}</span>
                          {v.sku ? <span className="ml-2 text-muted-foreground">{v.sku}</span> : null}
                          {v.price && (
                            <span className="ml-2 text-muted-foreground">{currency} {Number(v.price).toFixed(2)}</span>
                          )}
                        </div>
                        <span className="rounded-full border px-2 py-0.5 text-xs">{properCase(String(v.status))}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border p-3 text-muted-foreground text-sm">No variants</div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t bg-background px-6 py-4">
          <Button disabled={updateMutation.isPending} onClick={() => close()} variant="outline">
            Cancel
          </Button>
          <SubmitButton disabled={!dirty} isSubmitting={updateMutation.isPending} onClick={onSave}>
            Save
          </SubmitButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
