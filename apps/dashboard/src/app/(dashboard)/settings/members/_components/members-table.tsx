"use client";

import { useState } from "react";
import { type ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { columns } from "./members-columns";
import { createBrowserClient } from "@Faworra/supabase/client";
import { InviteTeamMembersModal } from "./modals/invite-team-members-modal";
import type { RouterOutputs } from "@Faworra/api/trpc/routers/_app";

type Members = RouterOutputs["teams"]["members"];
type Props = { initialMembers: Members };

export function MembersTable({ initialMembers }: Props) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isOpen, onOpenChange] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { data } = trpc.teams.members.useQuery(undefined, {
    initialData: initialMembers,
  });
  const { data: currentTeam } = trpc.teams.current.useQuery();

  // Determine current user's id once
  const supabase = createBrowserClient();
  if (typeof window !== "undefined" && currentUserId === null) {
    void supabase.auth
      .getUser()
      .then((r) => setCurrentUserId(r.data.user?.id ?? null))
      .catch(() => setCurrentUserId(null));
  }

  const currentUserRole = (data ?? []).find((m) => m.id === currentUserId)?.role;

  const table = useReactTable<Members[number]>({
    data: (data ?? []) as any,
    columns: columns as any,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: { columnFilters },
    getRowId: (row) => row.id,
    meta: {
      teamId: currentTeam?.teamId,
      currentUserRole,
      totalOwners: (data ?? []).filter((m) => m.role === "owner").length,
    },
  });

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-4">
        <Input
          className="flex-1"
          placeholder="Search..."
          value={(table.getColumn("user")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("user")?.setFilterValue(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <Button onClick={() => onOpenChange(true)}>Invite member</Button>
          <InviteTeamMembersModal onOpenChange={onOpenChange} />
        </Dialog>
      </div>

      <Table>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow className="hover:bg-transparent" data-state={row.getIsSelected() && "selected"} key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell className={cell.column.columnDef.meta as any} key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell className="h-24 text-center" colSpan={columns.length}>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
