"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Required"),
  color: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

type Category = { id: string; name: string; children?: Category[] };

export function CategorySheet({ open, onOpenChange, onSaved, category, parents = [] }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  category?: any;
  parents?: Category[];
}) {
  const create = trpc.productCategories.create.useMutation();
  const update = trpc.productCategories.update.useMutation();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: category?.id,
      name: category?.name || "",
      color: category?.color || "",
      description: category?.description || "",
      parentId: category?.parentId || undefined,
    },
    values: {
      id: category?.id,
      name: category?.name || "",
      color: category?.color || "",
      description: category?.description || "",
      parentId: category?.parentId || undefined,
    },
  });

  const isPending = create.isPending || update.isPending;

  const onSubmit = async (data: FormData) => {
    if (category?.id) {
      await update.mutateAsync({ id: category.id, name: data.name, color: data.color || null, description: data.description || null, parentId: data.parentId || null });
    } else {
      await create.mutateAsync({ name: data.name, color: data.color || null, description: data.description || null, parentId: data.parentId || null });
    }
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex flex-col overflow-hidden p-0 sm:max-w-[650px]">
        <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-0">
          <SheetTitle className="text-xl">{category ? "Edit Category" : "Add Category"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="scrollbar-hide flex-1 overflow-y-auto space-y-4 px-6 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Category name" {...field} />
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
                      <Textarea placeholder="Optional" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <input
                            aria-label="Pick color"
                            className="h-8 w-10 cursor-pointer rounded border bg-transparent p-1"
                            onChange={(e) => field.onChange(e.target.value)}
                            type="color"
                            value={field.value || "#9b9b9b"}
                          />
                          <Input onChange={(e) => field.onChange(e.target.value)} placeholder="#4f46e5" value={field.value || ""} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : v)} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {flatten(parents).map((p) => (
                            <SelectItem key={p.id} value={p.id}>{indentLabel(p)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex flex-shrink-0 justify-end gap-4 border-t px-6 py-4">
              <Button disabled={isPending} type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <SubmitButton isSubmitting={isPending} type="submit">Save</SubmitButton>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

function flatten(tree: Category[], depth = 0): Array<Category & { _depth: number }> {
  const out: Array<Category & { _depth: number }> = [];
  for (const n of tree) {
    out.push({ ...n, _depth: depth });
    if (n.children?.length) out.push(...flatten(n.children, depth + 1));
  }
  return out;
}

function indentLabel(c: any) {
  return `${"\u00A0\u00A0".repeat(c._depth || 0)}${c.name}`;
}
