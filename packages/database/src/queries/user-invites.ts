import { and, eq, inArray, or, sql } from "drizzle-orm";
import type { DbClient } from "../client";
import { teams, userInvites, users, usersOnTeam } from "../schema";

export async function getTeamInvites(db: DbClient, teamId: string) {
  return await db
    .select({
      id: userInvites.id,
      email: userInvites.email,
      role: userInvites.role,
      code: userInvites.code,
    })
    .from(userInvites)
    .where(eq(userInvites.teamId, teamId))
    .orderBy(userInvites.createdAt);
}

export async function getInvitesByEmail(db: DbClient, email: string) {
  return await db
    .select({
      id: userInvites.id,
      email: userInvites.email,
      role: userInvites.role,
      code: userInvites.code,
      team: {
        id: teams.id,
        name: teams.name,
      },
    })
    .from(userInvites)
    .innerJoin(teams, eq(userInvites.teamId, teams.id))
    .where(eq(userInvites.email, email))
    .orderBy(userInvites.createdAt);
}

type CreateTeamInvitesParams = {
  teamId: string;
  invites: { email: string; role: "owner" | "agent"; invitedBy: string }[];
};

type InviteValidationResult = {
  validInvites: { email: string; role: "owner" | "agent"; invitedBy: string }[];
  skippedInvites: { email: string; reason: "already_member" | "already_invited" | "duplicate" }[];
};

async function validateInvites(
  db: DbClient,
  teamId: string,
  invites: { email: string; role: "owner" | "agent"; invitedBy: string }[],
): Promise<InviteValidationResult> {
  const unique = invites.filter(
    (invite, idx, arr) => idx === arr.findIndex((i) => i.email.toLowerCase() === invite.email.toLowerCase()),
  );
  const emails = unique.map((i) => i.email.toLowerCase());

  // Existing members with matching emails
  const existingMembers = await db
    .select({ email: users.email })
    .from(usersOnTeam)
    .innerJoin(users, eq(usersOnTeam.userId, users.id))
    .where(
      and(
        eq(usersOnTeam.teamId, teamId),
        or(...emails.map((e) => sql`LOWER(${users.email}) = ${e}`)),
      ),
    );
  const existingSet = new Set(existingMembers.map((m) => (m.email || "").toLowerCase()).filter(Boolean));

  // Pending invites with matching emails
  const pendings = await db
    .select({ email: userInvites.email })
    .from(userInvites)
    .where(
      and(eq(userInvites.teamId, teamId), or(...emails.map((e) => sql`LOWER(${userInvites.email}) = ${e}`))),
    );
  const pendingSet = new Set(pendings.map((p) => (p.email || "").toLowerCase()).filter(Boolean));

  const validInvites: typeof unique = [];
  const skippedInvites: InviteValidationResult["skippedInvites"] = [];

  for (const inv of unique) {
    const e = inv.email.toLowerCase();
    if (existingSet.has(e)) {
      skippedInvites.push({ email: inv.email, reason: "already_member" });
    } else if (pendingSet.has(e)) {
      skippedInvites.push({ email: inv.email, reason: "already_invited" });
    } else {
      validInvites.push(inv);
    }
  }
  return { validInvites, skippedInvites };
}

export async function createTeamInvites(db: DbClient, params: CreateTeamInvitesParams) {
  const { teamId, invites } = params;
  const { validInvites, skippedInvites } = await validateInvites(db, teamId, invites);
  if (validInvites.length === 0) {
    return { results: [] as { email: string; role: "owner" | "agent" }[], skippedInvites };
  }

  const results: { email: string; role: "owner" | "agent" }[] = [];
  for (const inv of validInvites) {
    try {
      await db.insert(userInvites).values({
        teamId,
        email: inv.email,
        role: inv.role,
        invitedBy: inv.invitedBy,
        code: undefined,
      });
      results.push({ email: inv.email, role: inv.role });
    } catch {
      // In case of race condition, skip silently
    }
  }
  return { results, skippedInvites };
}

export async function deleteTeamInvite(db: DbClient, params: { id: string; teamId: string }) {
  const { id, teamId } = params;
  const deleted = await db
    .delete(userInvites)
    .where(and(eq(userInvites.id, id), eq(userInvites.teamId, teamId)));
  return deleted;
}

export async function acceptTeamInvite(db: DbClient, params: { id: string; userId: string }) {
  const invite = await db
    .select({ id: userInvites.id, teamId: userInvites.teamId, role: userInvites.role })
    .from(userInvites)
    .where(eq(userInvites.id, params.id))
    .limit(1);
  const row = invite[0];
  if (!row?.teamId) throw new Error("Invite not found");

  // Ensure not already a member
  const membership = await db
    .select({ id: usersOnTeam.id })
    .from(usersOnTeam)
    .where(and(eq(usersOnTeam.teamId, row.teamId), eq(usersOnTeam.userId, params.userId)))
    .limit(1);
  if (!membership.length) {
    await db.insert(usersOnTeam).values({ teamId: row.teamId, userId: params.userId, role: row.role });
  }

  await db.delete(userInvites).where(eq(userInvites.id, row.id));
  return { teamId: row.teamId };
}

export async function declineTeamInvite(db: DbClient, params: { id: string; email: string }) {
  return await db
    .delete(userInvites)
    .where(and(eq(userInvites.id, params.id), eq(userInvites.email, params.email)));
}
