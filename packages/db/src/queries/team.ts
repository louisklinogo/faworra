import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { teamMemberships } from "../schema/team";
import { user } from "../schema/auth";

export async function getTeamMembers(db: Database, teamId: string) {
	const members = await db
		.select({
			id: teamMemberships.id,
			role: teamMemberships.role,
			user: {
				id: user.id,
				email: user.email,
				// Map 'name' to 'fullName' for API consistency
				fullName: user.name,
				avatarUrl: user.image,
			},
		})
		.from(teamMemberships)
		.innerJoin(user, eq(teamMemberships.userId, user.id))
		.where(eq(teamMemberships.teamId, teamId));

	return members;
}

