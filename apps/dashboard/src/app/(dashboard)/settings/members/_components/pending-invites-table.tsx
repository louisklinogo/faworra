"use client";

import { useState } from "react";
import { type ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { trpc } from "@/lib/trpc/client";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PendingInvitesHeader } from "./pending-invites-header";
import { columns } from "./pending-invites-columns";
import type { RouterOutputs } from "@Faworra/api/trpc/routers/_app";

type Invites = RouterOutputs["teams"]["teamInvites"];
type Props = { initialInvites: Invites };

export function PendingInvitesTable({ initialInvites }: Props) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { data } = trpc.teams.teamInvites.useQuery(undefined, { initialData: initialInvites });

  const table = useReactTable<Invites[number]>({
    data: (data ?? []) as any,
    columns: columns as any,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="w-full">
      <PendingInvitesHeader table={table as any} />
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
              <TableCell className="h-[360px] text-center" colSpan={columns.length}>
                <h2 className="mb-1 font-medium">No Pending Invitations Found</h2>
                <span className="text-muted-foreground">Use the button above to invite a Team Member.</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
