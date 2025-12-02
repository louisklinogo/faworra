"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MoreHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type TeamMember = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "owner" | "admin" | "agent" | "viewer";
  createdAt: string | null;
};

export const columns: ColumnDef<TeamMember>[] = [
  {
    id: "user",
    accessorKey: "fullName",
    filterFn: (row, _colId, filterValue: string) => {
      const name = row.original.fullName?.toLowerCase() || "";
      const email = row.original.email?.toLowerCase() || "";
      const v = (filterValue || "").toLowerCase();
      return name.includes(v) || email.includes(v);
    },
    cell: ({ row }) => {
      const name = row.original.fullName || "";
      const email = row.original.email || "";
      return (
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{name?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-sm text-muted-foreground">{email}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const queryClient = useQueryClient();
      const router = useRouter();
      const meRole = (table.options.meta as any)?.currentUserRole as TeamMember["role"] | undefined;
      const totalOwners = (table.options.meta as any)?.totalOwners as number | undefined;

      const utils = trpc.useUtils();
      const updateMember = trpc.teams.updateMember.useMutation({
        onSuccess: () => utils.teams.members.invalidate(),
      });
      const removeMember = trpc.teams.deleteMember.useMutation({
        onSuccess: () => utils.teams.members.invalidate(),
      });
      const leave = trpc.teams.leave.useMutation({
        onSuccess: () => router.push("/teams"),
      });

      const canEditRole = meRole === "owner" && (row.original.role !== "owner" || (totalOwners ?? 0) > 1);

      return (
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            {canEditRole ? (
              <Select
                value={row.original.role}
                onValueChange={(role) =>
                  updateMember.mutate({ role: role as any, teamId: (table.options.meta as any)?.teamId, userId: row.original.id })
                }
              >
                <SelectTrigger className="w-[140px]"><SelectValue placeholder={row.original.role} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="agent">Member</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-muted-foreground">{row.original.role === "agent" ? "Member" : row.original.role}</span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 w-8 p-0" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialog>
                  <DropdownMenuItem asChild className="text-destructive">
                    <AlertDialogTrigger>Remove Member</AlertDialogTrigger>
                  </DropdownMenuItem>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={removeMember.isPending}
                        onClick={() => removeMember.mutate({ teamId: (table.options.meta as any)?.teamId, userId: row.original.id })}
                      >
                        {removeMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <DropdownMenuItem asChild className="text-destructive">
                    <AlertDialogTrigger>Leave Team</AlertDialogTrigger>
                  </DropdownMenuItem>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave Team</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={leave.isPending}
                        onClick={() => leave.mutate({ teamId: (table.options.meta as any)?.teamId })}
                      >
                        {leave.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      );
    },
    meta: {
      className: "text-right",
    } as any,
  },
];
