import { notFound, redirect } from "next/navigation";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { communicationThreads, and, eq } from "@Faworra/database/schema";
import { ThreadView } from "@/components/inbox/thread-view";

export default async function ThreadDeepLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");
  const [row] = await db
    .select({ id: communicationThreads.id, teamId: communicationThreads.teamId })
    .from(communicationThreads)
    .where(and(eq(communicationThreads.id, id), eq(communicationThreads.teamId, teamId)))
    .limit(1);
  if (!row) notFound();
  return (
    <main className="p-6">
      <div className="h-[calc(100vh-118px)] overflow-hidden">
        <ThreadView threadId={id} />
      </div>
    </main>
  );
}
