import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { getTeamInvites, getTeamMembers } from "@Faworra/database/queries";
import { TeamMembersView } from "./_components/team-members-view";

export default async function MembersPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) {
    // Server-first: if no team, render minimal hint (routing guards elsewhere may redirect)
    return <div className="p-6 text-sm text-muted-foreground">Select a team to manage members.</div>;
  }

  const [members, invites] = await Promise.all([
    getTeamMembers(db, { teamId }),
    getTeamInvites(db, teamId),
  ]);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold">Team</h1>
      <TeamMembersView initialMembers={members} initialInvites={invites} />
    </div>
  );
}
