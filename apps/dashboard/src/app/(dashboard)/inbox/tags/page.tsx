import { getTagsWithUsage } from "@Faworra/database/queries";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { redirect } from "next/navigation";
import { TagsManager } from "./_components/tags-manager";

export default async function InboxTagsPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");
  const tags = await getTagsWithUsage(db, { teamId });
  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="font-medium text-2xl">Tags</h1>
        <p className="text-muted-foreground text-sm">Manage triage and reporting labels</p>
      </div>
      <TagsManager initialItems={tags as Array<{ id: string; name: string; color: string | null; createdAt: Date; usageCount: number }>} />
    </main>
  );
}
