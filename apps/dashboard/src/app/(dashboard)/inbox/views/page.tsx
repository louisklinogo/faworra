import { savedInboxViews, eq } from "@Faworra/database/schema";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { redirect } from "next/navigation";
import { ViewsManager } from "./_components/views-manager";
import { InboxSubnav } from "@/components/inbox/inbox-subnav";

export default async function InboxViewsPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");
  const rows = await db
    .select({ id: savedInboxViews.id, name: savedInboxViews.name, filter: savedInboxViews.filter, ownerUserId: savedInboxViews.ownerUserId })
    .from(savedInboxViews)
    .where(eq(savedInboxViews.teamId, teamId));
  return (
    <div className="-mx-8 -mb-4 flex h-full">
      <InboxSubnav />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="font-medium text-2xl">Saved Views</h1>
          <p className="text-muted-foreground text-sm">Create presets for common triage filters</p>
        </div>
        <ViewsManager initialItems={rows} />
      </main>
    </div>
  );
}
