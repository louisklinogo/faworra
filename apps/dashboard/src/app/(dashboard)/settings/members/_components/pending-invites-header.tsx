"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import { InviteTeamMembersModal } from "./modals/invite-team-members-modal";

type Props = { table: Table<any> };

export function PendingInvitesHeader({ table }: Props) {
  const [isOpen, onOpenChange] = useState(false);

  return (
    <div className="mb-4 flex items-center gap-4">
      <Input
        className="flex-1"
        placeholder="Search..."
        value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
        onChange={(e) => table.getColumn("email")?.setFilterValue(e.target.value)}
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
  );
}
