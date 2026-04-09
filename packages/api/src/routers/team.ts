import { getTeamMembers } from "@faworra-new/db/queries/team";
import { protectedProcedure, router } from "../index";
import { getTeamList } from "../lib/team";

export const teamRouter = router({
	/**
	 * Returns the currently active team for the authenticated user.
	 * Returns null for teamless authenticated users (e.g. before onboarding).
	 * Agrees with `user.me.activeTeam` for the same session state.
	 * Mirrors Midday's `team.current` primitive.
	 */
	current: protectedProcedure.query(({ ctx }) => {
		return ctx.activeTeam;
	}),

	/**
	 * Returns all accepted memberships the user can switch into, with the
	 * display metadata needed by the workspace switcher: membershipId, teamId,
	 * name, logoUrl, and role. Non-actionable invites are excluded — only
	 * accepted memberships appear here.
	 * Mirrors Midday's `team.list` primitive.
	 */
	list: protectedProcedure.query(({ ctx }) => {
		return getTeamList(ctx.userId);
	}),

	/**
	 * Returns all team members for the current team with user info.
	 * Used for assigning users to transactions.
	 */
	members: protectedProcedure.query(async ({ ctx }) => {
		if (!ctx.activeTeam?.id) {
			return [];
		}

		return getTeamMembers(ctx.db, ctx.activeTeam.id);
	}),
});
