import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { switchTeam } from "../lib/team";
import {
	getUserPreferences,
	updateUserPreferences,
	userPreferencesUpdateSchema,
} from "../lib/user";

export const userRouter = router({
	/**
	 * Returns the currently authenticated user along with their active workspace
	 * identity. Mirrors Midday's `user.me` primitive.
	 * - Active team and membership are null for teamless authenticated users.
	 * - needsOnboarding indicates no accepted membership could be resolved.
	 */
	me: protectedProcedure.query(async ({ ctx }) => {
		const preferences = await getUserPreferences(
			ctx.userId,
			ctx.requestLocation
		);

		return {
			id: ctx.session.user.id,
			name: ctx.session.user.name,
			email: ctx.session.user.email,
			image: ctx.session.user.image ?? null,
			...preferences,
			activeTeam: ctx.activeTeam,
			membership: ctx.membership,
			needsOnboarding: ctx.needsOnboarding,
		};
	}),

	update: protectedProcedure
		.input(userPreferencesUpdateSchema)
		.mutation(({ ctx, input }) => {
			return updateUserPreferences(ctx.userId, input, ctx.requestLocation);
		}),

	/**
	 * Switches the active workspace for the current user by membership ID.
	 * Validates that the user holds the given membership before updating.
	 * Rejects invalid switch targets without mutating the current workspace.
	 * Uses activeMembershipId as the source of truth per the membership-first invariant.
	 */
	switchTeam: protectedProcedure
		.input(z.object({ membershipId: z.string().uuid() }))
		.mutation(({ ctx, input }) => {
			return switchTeam(ctx.userId, input.membershipId);
		}),
});
