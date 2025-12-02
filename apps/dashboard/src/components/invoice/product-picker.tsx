"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  onSelect: (name: string, price?: number) => void;
};

export function ProductPicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data } = trpc.products.list.useQuery(
    q ? { search: q, limit: 8 } : { limit: 8 },
    { staleTime: 30_000 },
  );

  const items = (data?.items ?? []).map((row: any) => ({
    id: row.product?.id ?? row.id,
    name: row.product?.name ?? row.name,
  }));

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button className="h-9 gap-1" size="sm" type="button" variant="outline">
          <Search className="h-3.5 w-3.5" />
          Pick
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-3" sideOffset={8}>
        <div className="space-y-3">
          <Input
            autoFocus
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="max-h-[220px] space-y-1 overflow-auto">
            {items.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">No matches</div>
            ) : (
              items.map((p) => (
                <button
                  key={p.id}
                  className="w-full rounded px-2 py-2 text-left hover:bg-muted/60"
                  onClick={() => {
                    onSelect(p.name);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <div className="truncate text-sm font-medium">{p.name}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
