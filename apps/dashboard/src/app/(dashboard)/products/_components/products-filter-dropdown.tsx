"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

type Values = {
  statuses?: string[];
  category?: string;
};

type Props = {
  values: Values;
  onChange: (update: Partial<Values>) => void;
};

export function ProductsFilterDropdown({ values, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const { data: categories = [] } = trpc.productCategories.list.useQuery(undefined, {
    enabled: open,
    staleTime: 60_000,
  });

  const apply = (update: Partial<Values>) => onChange(update);

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Filters" size="icon" variant="outline">
          <Icons.Filter className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px] p-0" sideOffset={10}>
        {/* Status */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Status className="mr-2 h-4 w-4" />
              <span>Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent alignOffset={-4} className="p-1" sideOffset={14}>
                {(["active", "draft", "archived"] as const).map((s) => (
                  <DropdownMenuCheckboxItem
                    checked={Boolean(values.statuses?.includes(s))}
                    key={s}
                    onCheckedChange={() => {
                      const curr = values.statuses ?? [];
                      const next = curr.includes(s) ? curr.filter((v) => v !== s) : [...curr, s];
                      apply({ statuses: [...next].sort() });
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* Categories */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Category className="mr-2 h-4 w-4" />
              <span>Category</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                alignOffset={-4}
                className="max-h-[320px] w-[300px] overflow-auto p-1"
                sideOffset={14}
              >
                <div className="sticky top-0 z-10 bg-popover p-2 pb-1">
                  <Input
                    className="h-8"
                    onChange={(e) => setCategoryQuery(e.target.value)}
                    placeholder="Search categories"
                    value={categoryQuery}
                  />
                </div>
                {categories.length > 0 ? (
                  categories
                    .filter((c: any) =>
                      (c?.name ?? "").toLowerCase().includes(categoryQuery.toLowerCase()),
                    )
                    .map((category: any) => (
                      <DropdownMenuCheckboxItem
                        checked={values.category === category.slug}
                        key={category.id}
                        onCheckedChange={() => {
                          const next = values.category === category.slug ? undefined : category.slug;
                          apply({ category: next as any });
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          {category.color ? (
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-muted" />
                          )}
                          {category.name}
                        </span>
                      </DropdownMenuCheckboxItem>
                    ))
                ) : (
                  <div className="px-2 py-1.5 text-muted-foreground text-xs">No categories</div>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProductsFilterDropdown;
