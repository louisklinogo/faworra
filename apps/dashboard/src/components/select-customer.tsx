"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@midday/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import type { JSONContent } from "@tiptap/react";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";

export function SelectCustomer() {
  const trpc = useTRPC();
  const { setParams } = useInvoiceParams();
  const { setValue } = useFormContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 250);

  const queryInput = useMemo(
    () => ({
      limit: 50,
      search: debouncedSearch.trim() || undefined,
    }),
    [debouncedSearch],
  );

  const { data, isLoading } = trpc.clients.list.useQuery(queryInput);

  const clients = data?.items ?? [];

  const handleManualEntry = () => {
    const emptyContent: JSONContent = { type: "doc", content: [] };
    setParams({ selectedCustomerId: null });
    setValue("customerDetails", emptyContent, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("customerId", null, { shouldValidate: true, shouldDirty: true });
    setValue("customerName", null, { shouldValidate: true, shouldDirty: true });
    setOpen(false);
  };

  const handleSelect = (id: string) => {
    setParams({ selectedCustomerId: id });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-expanded={open}
          className="font-mono text-[#434343] p-0 text-[11px] h-auto hover:bg-transparent"
        >
          {clients.length ? "Select customer" : "Add customer details"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" sideOffset={8} align="start">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search clients..."
            className="p-2 text-xs"
          />
          <CommandList className="max-h-[220px] overflow-auto">
            <CommandEmpty className="text-xs p-2 text-muted-foreground">
              {isLoading ? (
                "Loading clients..."
              ) : (
                <button type="button" onClick={handleManualEntry} className="underline">
                  Add details manually
                </button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name ?? client.id}
                  onSelect={() => handleSelect(client.id)}
                  className="text-xs"
                >
                  {client.name || "Unnamed client"}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
