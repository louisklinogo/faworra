"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type ComposerTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: string | null;
  disabled?: boolean;
  onInsertTemplate: (content: string) => void;
};

export function ComposerTemplateDialog({
  open,
  onOpenChange,
  provider,
  disabled,
  onInsertTemplate,
}: ComposerTemplateDialogProps) {
  const [search, setSearch] = useState("");
  const queryInput = useMemo(
    () => ({
      provider: provider ?? undefined,
      q: search ? search.trim() : undefined,
      limit: 30,
    }),
    [provider, search],
  );
  const { data, isLoading, isFetching } = trpc.communications.templates.useQuery(queryInput, {
    enabled: open && !disabled,
    staleTime: 0,
  });

  const handleInsert = (body: string) => {
    if (!body) return;
    onInsertTemplate(body);
    onOpenChange(false);
  };

  const showLoading = isLoading || (isFetching && !data?.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insert template</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            autoFocus
            placeholder="Search templates by name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={disabled}
          />
          <div className="rounded-md border">
            <ScrollArea className="max-h-[320px]">
              <div className="divide-y">
                {showLoading ? (
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : data && data.length ? (
                  data.map((template) => (
                    <div className="space-y-2 p-4" key={template.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{template.name}</p>
                          {template.category ? (
                            <p className="text-xs text-muted-foreground">{template.category}</p>
                          ) : null}
                        </div>
                        <Button onClick={() => handleInsert(template.body)} size="sm" variant="outline">
                          Insert
                        </Button>
                      </div>
                      {template.body ? (
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground line-clamp-4">
                          {template.body}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">No templates found</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
