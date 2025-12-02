"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ComboboxMulti } from "@/components/ui/combobox-multi";

type Tag = { id: string; name: string };

export function TagsDialog({
  open,
  allTags,
  values,
  onApply,
  onClose,
}: {
  open: boolean;
  allTags: Tag[];
  values: string[];
  onApply: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<string[]>(values);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-black/20 p-10">
      <div className="w-full max-w-md rounded-md border bg-background p-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Edit tags (Esc to close)</div>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-full">
            <ComboboxMulti
              items={(allTags || []).map((t) => ({ id: t.id, label: t.name }))}
              onChange={setLocal}
              placeholder="Tags"
              searchPlaceholder="Search tags..."
              values={local}
            />
          </div>
          <Button size="sm" onClick={() => onApply(local)}>Apply</Button>
        </div>
      </div>
    </div>
  );
}

export default TagsDialog;
