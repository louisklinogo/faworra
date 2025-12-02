"use client";

import { useMemo, useState } from "react";
import { MdArticle } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc/client";

export type ArticleSearchResult = {
  id: string;
  title: string;
  url: string | null;
  summary: string | null;
};

type ArticleSearchPopoverProps = {
  disabled?: boolean;
  onSelect: (result: ArticleSearchResult) => void;
};

export function ArticleSearchPopover({ disabled, onSelect }: ArticleSearchPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchTerm = query.trim();
  const input = useMemo(() => ({ q: searchTerm.length >= 2 ? searchTerm : "--", limit: 8 }), [searchTerm]);

  const { data, isFetching } = trpc.communications.articleSearch.useQuery(input, {
    enabled: open && searchTerm.length >= 2,
    // TanStack Query v5 removed keepPreviousData; show a subtle spinner instead
    staleTime: 0,
  });

  const handleSelect = (result: ArticleSearchResult) => {
    onSelect(result);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button disabled={disabled} size="icon" type="button" variant="ghost">
              {isFetching ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /> : <MdArticle className="h-5 w-5" />}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Help center articles</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-80 p-0" sideOffset={8}>
        <Command shouldFilter={false}>
          <CommandInput
            autoFocus
            placeholder="Search articles"
            value={query}
            onValueChange={setQuery}
            disabled={disabled}
          />
          <CommandList className="max-h-60">
            {searchTerm.length < 2 ? (
              <CommandEmpty>Type at least 2 characters</CommandEmpty>
            ) : data && data.length ? (
              <CommandGroup>
                {data.map((item) => (
                  <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      {item.summary ? (
                        <span className="text-xs text-muted-foreground line-clamp-2">{item.summary}</span>
                      ) : null}
                      {item.url ? (
                        <span className="text-xs text-blue-600 underline">{item.url}</span>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : isFetching ? (
              <CommandEmpty>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border border-muted-foreground border-t-transparent align-middle" />
                Searching…
              </CommandEmpty>
            ) : (
              <CommandEmpty>No matches found</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
