"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

type Invite = {
  id: string;
  email: string;
  role: string;
};

export function TeamInviteItem({ invite }: { invite: Invite }) {
  const utils = trpc.useUtils();
  const router = useRouter();

  const { mutate: accept, isPending: isAccepting } = trpc.teams.acceptInvite.useMutation({
    onSuccess: () => {
      utils.teams.invitesByEmail.invalidate();
      router.push("/");
      router.refresh();
    },
  });

  const { mutate: decline, isPending: isDeclining } = trpc.teams.declineInvite.useMutation({
    onSuccess: () => utils.teams.invitesByEmail.invalidate(),
  });

  const teamName = (invite as any)?.team?.name ?? "Team";

  return (
    <div className="flex items-center justify-between rounded border p-2">
      <div className="text-sm">
        <div className="font-medium">{teamName}</div>
        <div className="text-muted-foreground text-xs">Role: {invite.role}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          disabled={isAccepting}
          onClick={() => accept({ id: invite.id })}
          size="sm"
        >
          {isAccepting ? "Accepting…" : "Accept"}
        </Button>
        <Button
          disabled={isDeclining}
          onClick={() => decline({ id: invite.id })}
          size="sm"
          variant="outline"
        >
          {isDeclining ? "Declining…" : "Decline"}
        </Button>
      </div>
    </div>
  );
}
