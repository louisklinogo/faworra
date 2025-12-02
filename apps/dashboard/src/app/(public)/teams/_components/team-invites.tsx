"use client";

import { trpc } from "@/lib/trpc/client";
import { TeamInviteItem } from "./team-invite";
import type { RouterOutputs } from "@Faworra/api/trpc/routers/_app";

type Invites = RouterOutputs["teams"]["invitesByEmail"];

export function TeamInvitesSection({ initialInvites }: { initialInvites: Invites }) {
  const { data } = trpc.teams.invitesByEmail.useQuery(undefined, {
    initialData: initialInvites,
  });

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-8">
      <span className="mb-4 block font-mono text-sm text-[#878787]">Invitations</span>
      <div className="space-y-3">
        {data.map((inv) => (
          <TeamInviteItem invite={inv as any} key={inv.id} />
        ))}
      </div>
    </div>
  );
}
