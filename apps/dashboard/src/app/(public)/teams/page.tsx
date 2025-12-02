import { eq, teams, userInvites, usersOnTeam } from "@Faworra/database/schema";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db, getServerSession } from "@/lib/trpc/server";
import { Icons } from "@/components/ui/icons";
import { UserMenu } from "@/components/sidebar/user-menu";
import { TeamInvitesSection } from "./_components/team-invites";

async function getUserTeams(userId: string) {
  const rows = await db
    .select({ id: teams.id, name: teams.name })
    .from(usersOnTeam)
    .leftJoin(teams, eq(usersOnTeam.teamId, teams.id))
    .where(eq(usersOnTeam.userId, userId));
  return rows.filter((r) => r.id);
}

export default async function TeamsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const userId = session.user.id;
  const myTeams = await getUserTeams(userId);
  const userEmail = session.user.email;
  const invites = userEmail
    ? await db
        .select({
          id: userInvites.id,
          email: userInvites.email,
          role: userInvites.role,
          code: userInvites.code,
          teamId: teams.id,
          teamName: teams.name,
        })
        .from(userInvites)
        .leftJoin(teams, eq(userInvites.teamId, teams.id))
        .where(eq(userInvites.email, userEmail))
    : [];

  if (!myTeams.length && !invites.length) redirect("/teams/create");

  return (
    <>
      <header className="absolute left-0 right-0 flex w-full items-center justify-between">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="/">
            <Icons.LogoSmall />
          </Link>
        </div>
        <div className="mr-5 mt-4 md:mr-10 md:mt-10">
          <UserMenu />
        </div>
      </header>

      <div className="flex min-h-screen items-center justify-center overflow-hidden p-6 md:p-0">
        <div className="z-20 m-auto flex w-full max-w-[480px] flex-col">
          <div className="text-center">
            <h1 className="mb-2 font-serif text-lg">
              Welcome{session.user.user_metadata?.full_name ? ", " + String(session.user.user_metadata.full_name).split(" ")[0] : ""}
            </h1>
            {invites.length > 0 ? (
              <p className="mb-8 text-sm text-[#878787]">Join a team you’ve been invited to or create a new one.</p>
            ) : (
              <p className="mb-8 text-sm text-[#878787]">Select a team or create a new one.</p>
            )}
          </div>

          {myTeams.length > 0 && (
            <>
              <span className="mb-4 font-mono text-sm text-[#878787]">Teams</span>
              <div className="max-h-[260px] overflow-y-auto">
                <div className="space-y-2">
                  {myTeams.map((t) => (
                    <form action={`/api/teams/launch?teamId=${t.id}`} key={t.id} method="post">
                      <div className="flex items-center justify-between rounded border p-2">
                        <span>{t.name || t.id}</span>
                        <Button size="sm" type="submit" variant="outline">
                          Launch
                        </Button>
                      </div>
                    </form>
                  ))}
                </div>
              </div>
            </>
          )}

          {invites.length > 0 && (
            <TeamInvitesSection
              initialInvites={invites.map((i) => ({
                id: i.id,
                email: i.email,
                role: i.role as any,
                code: i.code,
                team: { id: i.teamId!, name: i.teamName ?? null },
              })) as any}
            />
          )}

          <div className="relative mt-12 w-full border-t-[1px] border-dashed border-border pt-6 text-center">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-4 text-sm text-[#878787]">Or</span>
            <Link className="w-full" href="/teams/create">
              <Button className="mt-2 w-full" variant="outline">
                Create team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
