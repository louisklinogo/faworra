"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ComboboxDropdown, type ComboboxItem } from "@/components/ui/combobox-dropdown";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useTeamCurrency } from "@/hooks/use-team-currency";
import { trpc } from "@/lib/trpc/client";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/ui/submit-button";

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "draft", "archived"]),
  type: z.enum(["physical", "digital", "service", "bundle"]),
  categorySlug: z.string().optional(),
  // Default variant (inline - only for create)
  sku: z.string().optional(),
  price: z.string().optional(),
  stockQuantity: z.string().optional(),
  stockManaged: z.boolean().optional(),
  fulfillmentType: z.enum(["stocked", "dropship", "made_to_order", "preorder"]).optional(),
});

type FormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  onSuccess?: () => void;
}

export function ProductForm({ onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const currency = useTeamCurrency();
  const utils = trpc.useUtils();

  const { data: categories = [] } = trpc.productCategories.list.useQuery();

  const form = useForm<FormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      type: "physical",
      categorySlug: undefined,
      sku: "",
      price: "",
      stockQuantity: "0",
      stockManaged: true,
      fulfillmentType: "stocked",
    },
  });

  const createMutation = trpc.products.create.useMutation({
    onSuccess: async () => {
      toast({ description: "Product created" });
      await Promise.all([
        utils.products.list.invalidate(),
        utils.products.stats.invalidate(),
        utils.products.topCategories.invalidate(),
      ]);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to create product",
      });
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

  const onSubmit = async (data: FormData) => {
    try {
      const isStockable = data.type === "physical";
      const stockManaged = isStockable ? Boolean(data.stockManaged) : false;
      const stockQty = isStockable && stockManaged && data.stockQuantity
        ? Number.parseInt(data.stockQuantity, 10)
        : 0;
      const fulfillment = isStockable
        ? data.fulfillmentType || "stocked"
        : "made_to_order";

      await createMutation.mutateAsync({
        name: data.name,
        description: data.description || null,
        status: data.status,
        type: data.type,
        categorySlug: data.categorySlug || null,
        variant: {
          sku: data.sku || null,
          price: data.price ? Number.parseFloat(data.price) : null,
          currency: currency,
          stockQuantity: stockQty,
          stockManaged,
          fulfillmentType: fulfillment,
        },
      } as any);
    } catch (_e) {
      // Error already handled by mutation
    }
  };

  const isPending = createMutation.isPending;

  const watchType = form.watch("type");
  const watchStockManaged = form.watch("stockManaged");
  const isStockable = watchType === "physical";

  return (
    <Form {...form}>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="scrollbar-hide flex-1 overflow-y-auto px-6 py-4">
          <Accordion className="space-y-0" defaultValue={["general", "variant"]} type="multiple">
            <AccordionItem value="general">
              <AccordionTrigger>General</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Classic T-Shirt" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your product..."
                            rows={3}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={(v) => {
                            field.onChange(v);
                            const nextIsStockable = v === "physical";
                            form.setValue("stockManaged", nextIsStockable ? true : false);
                            if (!nextIsStockable) {
                              form.setValue("stockQuantity", "0");
                              form.setValue("fulfillmentType", "made_to_order");
                            } else {
                              form.setValue("fulfillmentType", "stocked");
                            }
                          }} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="physical">Physical</SelectItem>
                              <SelectItem value="digital">Digital</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                              <SelectItem value="bundle">Bundle</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="categorySlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <ComboboxDropdown
                            items={
                              categories.map((c) => ({ id: c.slug, label: c.name })) as ComboboxItem[]
                            }
                            onCreate={async (name) => {
                              const created = await createCategoryMutation.mutateAsync({ name });
                              await utils.productCategories.list.invalidate();
                              field.onChange(created.slug);
                            }}
                            onSelect={(item) => field.onChange(item?.id || "")}
                            placeholder="Select category"
                            searchPlaceholder="Search or create category..."
                            selectedItem={
                              categories.find((c) => c.slug === field.value)
                                ? { id: field.value || "", label: categories.find((c) => c.slug === field.value)?.name || "" }
                                : undefined
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="variant">
              <AccordionTrigger>Default Variant</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., TSHIRT-BLUE-M" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ({currency})</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" step="0.01" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isStockable && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Track Stock</FormLabel>
                        <Switch
                          checked={!!watchStockManaged}
                          onCheckedChange={(checked) => form.setValue("stockManaged", Boolean(checked))}
                        />
                      </div>
                      {watchStockManaged && (
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

                          <FormField
                            control={form.control}
                            name="fulfillmentType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fulfillment</FormLabel>
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
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer - align with Transactions form */}
        <div className="flex flex-shrink-0 justify-end gap-4 border-t px-6 py-4">
          <Button disabled={isPending} onClick={() => onSuccess?.()} type="button" variant="outline">
            Cancel
          </Button>
          <SubmitButton isSubmitting={isPending} type="submit">
            Create
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
