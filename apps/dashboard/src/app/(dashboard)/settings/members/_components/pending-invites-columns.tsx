"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useQueryClient } from "@tanstack/react-query";

type Invite = { id: string; email: string | null; role: string };

export const columns: ColumnDef<Invite>[] = [
  {
    id: "email",
    accessorKey: "email",
    filterFn: (row, _colId, filterValue: string) => {
      const email = row.original.email?.toLowerCase() || "";
      const v = (filterValue || "").toLowerCase();
      return email.includes(v);
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{row.original.email?.slice(0, 1)?.toUpperCase() ?? "P"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">Pending Invitation</span>
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
        </div>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const utils = trpc.useUtils();
      const del = trpc.teams.deleteInvite.useMutation({
        onSuccess: () => utils.teams.teamInvites.invalidate(),
      });
      return (
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{row.original.role === "agent" ? "Member" : row.original.role}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 w-8 p-0" variant="ghost">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive" onClick={() => del.mutate({ id: row.original.id })}>
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      );
    },
    meta: { className: "text-right" } as any,
  },
];
