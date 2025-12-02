"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

type Item = { id: string; name: string; filter: unknown; ownerUserId: string | null };

export function ViewsManager({ initialItems }: { initialItems: Item[] }) {
  const utils = trpc.useUtils();
  const { data: items = initialItems } = trpc.communications.views.list.useQuery(undefined, {
    initialData: initialItems,
  });
  const [name, setName] = useState("");
  const create = trpc.communications.views.create.useMutation({
    onSuccess: () => {
      setName("");
      utils.communications.views.list.invalidate();
    },
  });
  const del = trpc.communications.views.delete.useMutation({
    onSuccess: () => utils.communications.views.list.invalidate(),
  });

  return (
    <div className="space-y-6">
      <div className="flex max-w-md items-center gap-2">
        <Input placeholder="View name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate({ name: name.trim() })}>
          Create
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Filter</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.name}</TableCell>
                <TableCell>
                  <code className="text-xs text-muted-foreground">
                    {JSON.stringify((typeof it.filter === 'object' && it.filter !== null ? it.filter : {}), null, 0)}
                  </code>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/inbox?view=${it.id}`}>Apply</a>
                  </Button>
                  <Button
                    className="ml-2"
                    size="sm"
                    variant="ghost"
                    onClick={() => del.mutate({ id: it.id })}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
