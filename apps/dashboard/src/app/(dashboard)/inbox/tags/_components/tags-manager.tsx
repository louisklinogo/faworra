"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

type Tag = { id: string; name: string; color: string | null; createdAt: Date; usageCount: number };

export function TagsManager({ initialItems }: { initialItems: Tag[] }) {
  const utils = trpc.useUtils();
  const { data: items = initialItems } = trpc.tags.listWithUsage.useQuery(undefined, { initialData: initialItems });
  const create = trpc.tags.create.useMutation({ onSuccess: () => { utils.tags.list.invalidate(); setName(""); } });
  const update = trpc.tags.update.useMutation({ onSuccess: () => { utils.tags.list.invalidate(); utils.tags.listWithUsage.invalidate(); } });
  const del = trpc.tags.delete.useMutation({ onSuccess: () => { utils.tags.list.invalidate(); utils.tags.listWithUsage.invalidate(); } });
  const merge = trpc.tags.merge.useMutation({ onSuccess: () => { utils.tags.list.invalidate(); utils.tags.listWithUsage.invalidate(); } });
  const [name, setName] = useState("");
  const [mergeTarget, setMergeTarget] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div className="flex max-w-md items-center gap-2">
        <Input placeholder="New tag name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate({ name: name.trim() })}>
          Create
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Usage</TableHead>
              <TableHead className="w-[260px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((t: Tag) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>
                  <input
                    aria-label="Tag color"
                    onChange={(e) => update.mutate({ id: t.id, color: e.target.value })}
                    type="color"
                    value={t.color ?? "#999999"}
                  />
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{t.usageCount}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => {
                    const nn = prompt("Rename tag", t.name);
                    if (nn && nn.trim()) update.mutate({ id: t.id, name: nn.trim() });
                  }}>
                    Rename
                  </Button>
                  <Button className="ml-2" size="sm" variant="ghost" onClick={() => del.mutate({ id: t.id })}>
                    Delete
                  </Button>
                  {items.length > 1 && (
                    <span className="ml-2 inline-flex items-center gap-2">
                      <select
                        aria-label="Merge target"
                        className="rounded border px-1 py-1 text-xs"
                        onChange={(e) => setMergeTarget((m) => ({ ...m, [t.id]: e.target.value }))}
                        value={mergeTarget[t.id] || ""}
                      >
                        <option value="">Merge into…</option>
                        {items
                          .filter((x) => x.id !== t.id)
                          .map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                            </option>
                          ))}
                      </select>
                      <Button
                        disabled={!mergeTarget[t.id] || merge.isPending}
                        onClick={() => merge.mutate({ sourceId: t.id, targetId: mergeTarget[t.id] })}
                        size="sm"
                        variant="secondary"
                      >
                        Merge
                      </Button>
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
