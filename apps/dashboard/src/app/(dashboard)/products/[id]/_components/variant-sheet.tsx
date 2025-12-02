"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { useTeamCurrency } from "@/hooks/use-team-currency";
import { trpc } from "@/lib/trpc/client";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/ui/submit-button";
import { currencies } from "@Faworra/schemas";

const variantSchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.string().optional(),
  cost: z.string().optional(),
  currency: z.string().optional(),
  fulfillmentType: z.enum(["stocked", "dropship", "made_to_order", "preorder"]).optional(),
  stockManaged: z.boolean().optional(),
  stockQuantity: z.string().optional(),
  leadTimeDays: z.string().optional(),
});

type FormData = z.infer<typeof variantSchema>;

type Props = {
  productId: string;
  variantId?: string;
  variant?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VariantSheet({ productId, variantId, variant, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const teamCurrency = useTeamCurrency();
  const utils = trpc.useUtils();

  const form = useForm<FormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      name: variant?.name || "",
      sku: variant?.sku || "",
      barcode: variant?.barcode || "",
      price: variant?.price?.toString() || "",
      cost: variant?.cost?.toString() || "",
      currency: variant?.currency || teamCurrency,
      fulfillmentType: variant?.fulfillmentType || "stocked",
      stockManaged: variant?.stockManaged ?? true,
      stockQuantity: "0",
      leadTimeDays: variant?.leadTimeDays?.toString() || "",
    },
  });

  const createMutation = trpc.products.variantCreate.useMutation({
    onSuccess: () => {
      toast({ description: "Variant created" });
      void Promise.all([
        utils.products.details.invalidate({ id: productId }),
        utils.products.stats.invalidate(),
        utils.products.topCategories.invalidate(),
      ]);
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to create variant",
      });
    },
  });

  const updateMutation = trpc.products.variantUpdate.useMutation({
    onSuccess: () => {
      toast({ description: "Variant updated" });
      void Promise.all([
        utils.products.details.invalidate({ id: productId }),
        utils.products.stats.invalidate(),
        utils.products.topCategories.invalidate(),
      ]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to update variant",
      });
    },
  });

  const upsertInventory = trpc.products.inventoryUpsert.useMutation({
    onSuccess: async () => {
      await utils.products.stats.invalidate();
    },
  });
  const { data: locations = [] } = trpc.products.inventoryLocations.useQuery(undefined, {
    staleTime: 60_000,
  });

  const onSubmit = async (data: FormData) => {
    try {
      const doUpsert = async (vId: string) => {
        const qty = data.stockManaged && data.stockQuantity ? Number.parseInt(data.stockQuantity, 10) : 0;
        if (Number.isFinite(qty) && qty > 0) {
          const loc = (locations as any[]).find((l) => l.isDefault) || (locations as any[])[0];
          if (loc?.id) {
            await upsertInventory.mutateAsync({
              variantId: vId,
              entries: [{ locationId: String(loc.id), onHand: qty, allocated: 0, safetyStock: 0 }],
            });
          }
        }
      };

      if (variantId) {
        await updateMutation.mutateAsync({
          id: variantId,
          name: data.name || null,
          sku: data.sku || null,
          barcode: data.barcode || null,
          price: data.price ? Number.parseFloat(data.price) : null,
          cost: data.cost ? Number.parseFloat(data.cost) : null,
          currency: data.currency || null,
          fulfillmentType: data.fulfillmentType,
          stockManaged: data.stockManaged,
          leadTimeDays: data.leadTimeDays ? Number.parseInt(data.leadTimeDays, 10) : null,
        });
        await doUpsert(variantId);
      } else {
        const created = await createMutation.mutateAsync({
          productId,
          name: data.name || null,
          sku: data.sku || null,
          barcode: data.barcode || null,
          price: data.price ? Number.parseFloat(data.price) : null,
          cost: data.cost ? Number.parseFloat(data.cost) : null,
          currency: data.currency || teamCurrency,
          fulfillmentType: data.fulfillmentType,
          stockManaged: data.stockManaged,
          leadTimeDays: data.leadTimeDays ? Number.parseInt(data.leadTimeDays, 10) : null,
        });
        if (created?.id) await doUpsert(String(created.id));
      }
    } catch (_e) {
      // Error handled by mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || upsertInventory.isPending;
  const watchCurrency = ((): string | undefined => {
    try {
      return (form.watch("currency") as string | undefined) || undefined;
    } catch {
      return undefined;
    }
  })();

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex flex-col overflow-hidden p-0 sm:max-w-[650px]">
        <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-0">
          <SheetTitle className="text-xl">{variantId ? "Edit Variant" : "Add Variant"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="scrollbar-hide flex-1 overflow-y-auto space-y-4 px-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Blue / Medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TSHIRT-BL-M" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ({watchCurrency || teamCurrency})</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" step="0.01" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost ({watchCurrency || teamCurrency})</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" step="0.01" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || teamCurrency}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fulfillmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fulfillment Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "stocked"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stocked">Stocked</SelectItem>
                      <SelectItem value="dropship">Dropship</SelectItem>
                      <SelectItem value="made_to_order">Made to Order</SelectItem>
                      <SelectItem value="preorder">Pre-order</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leadTimeDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Time (Days)</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stock controls parity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Track Stock</FormLabel>
                <FormField
                  control={form.control}
                  name="stockManaged"
                  render={({ field }) => (
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              {form.watch("stockManaged") && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Stock</FormLabel>
                        <FormControl>
                          <Input placeholder="0" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            </div>
            <div className="flex flex-shrink-0 justify-end gap-4 border-t px-6 py-4">
              <Button disabled={isPending} type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <SubmitButton isSubmitting={isPending} type="submit">
                {variantId ? "Update" : "Create"}
              </SubmitButton>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
