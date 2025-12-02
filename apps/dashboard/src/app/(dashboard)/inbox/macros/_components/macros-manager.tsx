"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

type MacroRow = { id: string; name: string; actions: unknown };
type MacroAction =
  | { type: "set_status"; status: "open" | "pending" | "resolved" | "snoozed" }
  | { type: "assign"; assignedUserId: string | null }
  | { type: "add_tags"; tagIds: string[] }
  | { type: "send_template"; templateId: string };

export function MacrosManager({ initialItems }: { initialItems: MacroRow[] }) {
  const utils = trpc.useUtils();
  const { data: items = initialItems } = trpc.communications.macros.list.useQuery(undefined, {
    initialData: initialItems,
  });
  const [name, setName] = useState("");
  const [actionsJson, setActionsJson] = useState("[]");
  const create = trpc.communications.macros.create.useMutation({
    onSuccess: () => {
      setName("");
      setActionsJson("[]");
      utils.communications.macros.list.invalidate();
    },
  });
  const del = trpc.communications.macros.delete.useMutation({
    onSuccess: () => utils.communications.macros.list.invalidate(),
  });
  const canCreate = useMemo(() => {
    try {
      const parsed = JSON.parse(actionsJson);
      return Array.isArray(parsed) && name.trim().length > 0;
    } catch {
      return false;
    }
  }, [actionsJson, name]);

  return (
    <div className="space-y-6">
      {
        <div className="max-w-2xl space-y-2 rounded border p-3">
          <div className="flex items-center gap-2">
            <Input placeholder="Macro name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button
              disabled={!canCreate || create.isPending}
              onClick={() => {
                const parsed = JSON.parse(actionsJson) as unknown;
                const arr = Array.isArray(parsed) ? (parsed as MacroAction[]) : ([] as MacroAction[]);
                create.mutate({ name: name.trim(), actions: arr as unknown[] });
              }}
            >
              Create
            </Button>
          </div>
          <Textarea
            placeholder='Actions (JSON), e.g., [{"type":"set_status","status":"pending"}]'
            rows={4}
            value={actionsJson}
            onChange={(e) => setActionsJson(e.target.value)}
          />
        </div>
      }

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead className="w-[120px] text-right">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it: MacroRow) => (
              <TableRow key={it.id}>
                <TableCell>{it.name}</TableCell>
                <TableCell>
                  <code className="text-xs text-muted-foreground">{JSON.stringify(Array.isArray(it.actions) ? it.actions : [])}</code>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => del.mutate({ id: it.id })}>
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
