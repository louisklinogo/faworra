import { getTeamAccounts } from "@Faworra/database/queries";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { redirect } from "next/navigation";
import { ConnectedChannelsTable } from "../_components/connected-channels-table";

export default async function InboxSettingsChannelsPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");
  const accounts = await getTeamAccounts(db, teamId);
  return <ConnectedChannelsTable initialAccounts={accounts as any} />;
}
