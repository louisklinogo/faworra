import { and, eq } from "drizzle-orm";
import type { DbClient } from "../client";
import { teams, users, usersOnTeam } from "../schema";

export async function getUserTeams(db: DbClient, userId: string) {
  return await db
    .select({
      team: {
        id: teams.id,
        name: teams.name,
        baseCurrency: teams.baseCurrency,
        country: teams.country,
        timezone: teams.timezone,
        quietHours: teams.quietHours,
        locale: teams.locale,
      },
    })
    .from(usersOnTeam)
    .innerJoin(teams, eq(usersOnTeam.teamId, teams.id))
    .where(eq(usersOnTeam.userId, userId));
}

export async function getTeamById(db: DbClient, teamId: string) {
  const result = await db
    .select({
      id: teams.id,
      name: teams.name,
      baseCurrency: teams.baseCurrency,
      country: teams.country,
      timezone: teams.timezone,
      quietHours: teams.quietHours,
      locale: teams.locale,
    })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  return result[0] || null;
}

export async function getTeamMembers(db: DbClient, params: { teamId: string }) {
  return await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: usersOnTeam.role,
      createdAt: usersOnTeam.createdAt,
    })
    .from(usersOnTeam)
    .innerJoin(users, eq(usersOnTeam.userId, users.id))
    .where(eq(usersOnTeam.teamId, params.teamId))
    .orderBy(users.fullName);
}

export async function deleteTeamMember(
  db: DbClient,
  params: { teamId: string; userId: string },
) {
  return await db.delete(usersOnTeam).where(
    and(eq(usersOnTeam.teamId, params.teamId), eq(usersOnTeam.userId, params.userId)),
  );
}

export async function updateTeamMember(
  db: DbClient,
  params: { teamId: string; userId: string; role: "owner" | "agent" | "admin" | "viewer" },
) {
  return await db
    .update(usersOnTeam)
    .set({ role: params.role })
    .where(and(eq(usersOnTeam.teamId, params.teamId), eq(usersOnTeam.userId, params.userId)));
}

export async function leaveTeam(db: DbClient, params: { teamId: string; userId: string }) {
  // Remove membership
  return await db
    .delete(usersOnTeam)
    .where(and(eq(usersOnTeam.teamId, params.teamId), eq(usersOnTeam.userId, params.userId)));
}
