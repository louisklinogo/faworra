import { macros, eq } from "@Faworra/database/schema";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { redirect } from "next/navigation";
import { MacrosManager } from "./_components/macros-manager";

export default async function InboxMacrosPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");
  const rows = await db
    .select({ id: macros.id, name: macros.name, actions: macros.actions })
    .from(macros)
    .where(eq(macros.teamId, teamId));
  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="font-medium text-2xl">Macros</h1>
        <p className="text-muted-foreground text-sm">Automate common actions and replies</p>
      </div>
      <MacrosManager initialItems={rows as Array<{ id: string; name: string; actions: unknown[] }>} />
    </main>
  );
}
