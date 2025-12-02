"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import { MembersTable } from "./members-table";
import { PendingInvitesTable } from "./pending-invites-table";
import type { RouterOutputs } from "@Faworra/api/trpc/routers/_app";

type Props = {
  initialMembers: RouterOutputs["teams"]["members"];
  initialInvites: RouterOutputs["teams"]["teamInvites"];
};

export function TeamMembersView({ initialMembers, initialInvites }: Props) {
  return (
    <Tabs defaultValue="members">
      <TabsList className="mb-4 flex w-full justify-start gap-4 border-b bg-transparent p-0">
        <TabsTrigger className="p-0" value="members">
          Team Members
        </TabsTrigger>
        <TabsTrigger className="p-0" value="pending">
          Pending Invitations
        </TabsTrigger>
      </TabsList>
      <TabsContent value="members">
        <Suspense>
          <MembersTable initialMembers={initialMembers} />
        </Suspense>
      </TabsContent>
      <TabsContent value="pending">
        <Suspense>
          <PendingInvitesTable initialInvites={initialInvites} />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
