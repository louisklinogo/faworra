import { TRPCError } from "@trpc/server";
import {
	protectedOwnerTeamProcedure,
	protectedProcedure,
	router,
} from "../index";
import {
	acceptTeamInvite,
	createTeamInvites,
	declineTeamInvite,
	deleteTeamInvite,
	listInvitesByEmail,
	listTeamInvites,
} from "../lib/team-invites";
import {
	acceptTeamInviteInputSchema,
	createTeamInvitesInputSchema,
	declineTeamInviteInputSchema,
	deleteTeamInviteInputSchema,
	normalizeTeamInviteInputs,
} from "../team-invites";

const requireSessionEmail = (email: string | undefined) => {
	if (!email) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Email is required for team invites",
		});
	}

	return email;
};

export const teamInvitesRouter = router({
	list: protectedOwnerTeamProcedure.query(({ ctx }) => {
		return listTeamInvites(ctx.activeTeam.id);
	}),
	invitesByEmail: protectedProcedure.query(({ ctx }) => {
		return listInvitesByEmail(requireSessionEmail(ctx.session.user.email));
	}),
	invite: protectedOwnerTeamProcedure
		.input(createTeamInvitesInputSchema)
		.mutation(({ ctx, input }) => {
			return createTeamInvites({
				teamId: ctx.activeTeam.id,
				invitedByUserId: ctx.userId,
				invites: normalizeTeamInviteInputs(input),
			});
		}),
	delete: protectedOwnerTeamProcedure
		.input(deleteTeamInviteInputSchema)
		.mutation(({ ctx, input }) => {
			return deleteTeamInvite({
				teamId: ctx.activeTeam.id,
				inviteId: input.inviteId,
			});
		}),
	accept: protectedProcedure
		.input(acceptTeamInviteInputSchema)
		.mutation(({ ctx, input }) => {
			return acceptTeamInvite({
				inviteId: input.inviteId,
				userId: ctx.userId,
				userEmail: requireSessionEmail(ctx.session.user.email),
			});
		}),
	decline: protectedProcedure
		.input(declineTeamInviteInputSchema)
		.mutation(({ ctx, input }) => {
			return declineTeamInvite({
				inviteId: input.inviteId,
				userEmail: requireSessionEmail(ctx.session.user.email),
			});
		}),
});
