"use client";

import { Ban, CheckCheck, Clock, Ellipsis, FolderArchive, Moon, Sun, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc/client";

type InboxBulkActionsProps = {
  ids: string[];
  members?: Array<{ id: string; fullName?: string | null; email?: string | null }>;
  currentUserId?: string | null;
  onSnoozeCustom?: () => void;
  onOpenTags?: () => void;
};

export function InboxBulkActions({ ids, members = [], currentUserId, onSnoozeCustom, onOpenTags }: InboxBulkActionsProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const updateThread = trpc.communications.threads.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.communications.threadsByStatus.invalidate(),
        utils.communications.ownershipCounts.invalidate(),
      ]);
    },
  });
  const bulkDelete = trpc.communications.threads.bulkDelete.useMutation({
    onSuccess: async () => {
      toast({ title: `Deleted ${ids.length} conversation${ids.length > 1 ? "s" : ""}` });
      await Promise.all([
        utils.communications.threadsByStatus.invalidate(),
        utils.communications.ownershipCounts.invalidate(),
      ]);
    },
  });
  const markRead = trpc.communications.messages.markRead.useMutation({
    onSuccess: async () => {
      await utils.communications.threadsByStatus.invalidate();
    },
  });

  const doAssign = async (assignedUserId: string | null) => {
    await Promise.all(ids.map((id) => updateThread.mutateAsync({ id, assignedUserId })));
    toast({ title: `Assigned ${ids.length} conversation${ids.length > 1 ? "s" : ""}` });
  };
  const doStatus = async (status: "open" | "pending" | "snoozed" | "resolved") => {
    await Promise.all(ids.map((id) => updateThread.mutateAsync({ id, status })));
    toast({ title: `Updated status for ${ids.length}` });
  };
  const doSnoozePreset = async (when: "1h" | "today-pm" | "tomorrow-9") => {
    const d = new Date();
    if (when === "1h") d.setHours(d.getHours() + 1);
    else if (when === "today-pm") { d.setHours(16, 0, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); }
    else if (when === "tomorrow-9") { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
    const iso = d.toISOString();
    await Promise.all(ids.map((id) => updateThread.mutateAsync({ id, status: "snoozed", snoozedUntil: iso })));
    toast({ title: `Snoozed ${ids.length}` });
  };
  const doMarkRead = async () => {
    await Promise.all(ids.map((id) => markRead.mutateAsync({ threadId: id })));
    toast({ title: `Marked ${ids.length} as read` });
  };
  const doDelete = async () => {
    await bulkDelete.mutateAsync({ ids });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-7 px-2 whitespace-nowrap" size="sm" variant="outline">
          <Ellipsis className="h-4 w-4" />
          <span className="ml-2">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <User className="mr-2 h-4 w-4" /> Assign
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-[220px]">
                <DropdownMenuItem onClick={() => doAssign(null)}>Unassigned</DropdownMenuItem>
                {members.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => doAssign(m.id)}>
                    {m.fullName || m.email || m.id}
                  </DropdownMenuItem>
                ))}
                {currentUserId && (
                  <DropdownMenuItem onClick={() => doAssign(currentUserId!)}>Assign to me</DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderArchive className="mr-2 h-4 w-4" /> Status
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-[180px]">
                <DropdownMenuItem onClick={() => doStatus("open")}>Open</DropdownMenuItem>
                <DropdownMenuItem onClick={() => doStatus("pending")}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => doStatus("snoozed")}>Snoozed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => doStatus("resolved")}>Resolved</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={doMarkRead}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark read
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Clock className="mr-2 h-4 w-4" /> Snooze
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-[180px]">
                <DropdownMenuItem onClick={() => doSnoozePreset("1h")}><Sun className="mr-2 h-4 w-4" /> 1 hour</DropdownMenuItem>
                <DropdownMenuItem onClick={() => doSnoozePreset("today-pm")}><Sun className="mr-2 h-4 w-4" /> Today 4pm</DropdownMenuItem>
                <DropdownMenuItem onClick={() => doSnoozePreset("tomorrow-9")}><Moon className="mr-2 h-4 w-4" /> Tomorrow 9am</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSnoozeCustom?.()}>Custom…</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={() => onOpenTags?.()}>
            <Tag className="mr-2 h-4 w-4" /> Tags…
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="text-destructive" onClick={doDelete}>
            <Ban className="mr-2 h-4 w-4" /> Delete…
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
