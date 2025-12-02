"use client";

import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InviteForm } from "../invite-form";

export function InviteTeamMembersModal({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  return (
    <DialogContent className="max-w-[455px]">
      <div className="p-4">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>Invite new members by email address.</DialogDescription>
        </DialogHeader>
        <InviteForm onSuccess={() => onOpenChange(false)} />
      </div>
    </DialogContent>
  );
}
