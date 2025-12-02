import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getOwnershipCounts, getThreadsByStatus } from "@Faworra/database/queries";
import { serializeThreadRow } from "@Faworra/database/serializers/communications";
import { createServerClient } from "@Faworra/supabase/server";
import { InboxGetStarted } from "@/components/inbox/inbox-get-started";
import { InboxSubnav } from "@/components/inbox/inbox-subnav";
import { InboxView } from "@/components/inbox/inbox-view";
import { db, getAuthenticatedUser, getCurrentTeamId } from "@/lib/trpc/server";

export default async function InboxConversationsPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");

  const supabase = await createServerClient();
  const { data: accounts } = await supabase
    .from("communication_accounts")
    .select("id,status")
    .eq("team_id", teamId);
  const anyAccounts = Boolean(accounts && accounts.length > 0);
  const isConnected = Boolean((accounts || []).some((a: any) => a.status === "connected"));
  const hasHealthIssues = Boolean((accounts || []).some((a: any) => a.status !== "connected"));

  const skipGate = (await cookies()).get("inboxSkipGate")?.value === "1";
  if (!isConnected && !skipGate) {
    return <InboxGetStarted hasAccounts={anyAccounts} />;
  }

  const threadsRaw = await getThreadsByStatus(db, { teamId, status: "open", limit: 50 });

  const threads = threadsRaw.map((row: any) => {
    const tagsValue = row.tags_json ?? row.tagsJson ?? "[]";
    let tags: Array<{ id: string; name: string; color: string | null }> = [];
    try {
      tags = typeof tagsValue === "string" ? JSON.parse(tagsValue) : tagsValue ?? [];
    } catch {
      tags = [];
    }
    const latestValue = row.latest_message_json ?? row.latestMessageJson ?? null;
    let latest: any;
    try {
      latest = latestValue
        ? typeof latestValue === "string"
          ? JSON.parse(latestValue)
          : latestValue
        : undefined;
    } catch {
      latest = undefined;
    }
    const unreadRaw = row.unread_count ?? row.unreadCount ?? 0;
    return serializeThreadRow(row, {
      latestMessage: latest,
      unreadCount: typeof unreadRaw === "number" ? unreadRaw : Number(unreadRaw) || 0,
      tags,
    });
  });

  const user = await getAuthenticatedUser();
  const ownership = await getOwnershipCounts(db, {
    teamId,
    status: "open",
    channel: undefined,
    accountId: undefined,
    tagIds: [],
    q: undefined,
    currentUserId: user?.id,
  });

  return (
    <div className="-mx-8 flex h-full min-h-0 w-full overflow-hidden">
      <InboxSubnav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {hasHealthIssues && (
          <div className="border-b bg-red-50 px-4 py-2 text-red-800 text-xs">
            Channel issues detected. <a className="underline" href="/inbox/settings/health">Review health</a>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-hidden">
          <InboxView teamId={teamId} initialThreads={threads} initialOwnership={ownership} />
        </div>
      </div>
    </div>
  );
}
