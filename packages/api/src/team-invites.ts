import z from "zod";

export const TEAM_INVITE_TTL_DAYS = 7;
export const teamInviteRoleSchema = z.enum([
	"owner",
	"admin",
	"accountant",
	"member",
]);
export const teamInviteInputSchema = z.object({
	email: z.email().trim().max(320, "Email must be 320 characters or fewer"),
	role: teamInviteRoleSchema.default("member"),
});

export const createTeamInvitesInputSchema = z
	.array(teamInviteInputSchema)
	.min(1, "At least one invite is required")
	.max(25, "You can invite at most 25 people at once");

export const deleteTeamInviteInputSchema = z.object({
	inviteId: z.uuid("Use a valid invite id"),
});

export const acceptTeamInviteInputSchema = z.object({
	inviteId: z.uuid("Use a valid invite id"),
});

export const declineTeamInviteInputSchema = z.object({
	inviteId: z.uuid("Use a valid invite id"),
});

export type CreateTeamInviteInput = z.infer<typeof teamInviteInputSchema>;
export type CreateTeamInvitesInput = z.infer<
	typeof createTeamInvitesInputSchema
>;
export type DeleteTeamInviteInput = z.infer<typeof deleteTeamInviteInputSchema>;
export type AcceptTeamInviteInput = z.infer<typeof acceptTeamInviteInputSchema>;
export type DeclineTeamInviteInput = z.infer<
	typeof declineTeamInviteInputSchema
>;

export const normalizeTeamInviteInput = (input: CreateTeamInviteInput) => {
	return {
		email: input.email.trim().toLowerCase(),
		role: input.role,
	};
};

export const normalizeTeamInviteInputs = (inputs: CreateTeamInvitesInput) => {
	return inputs.map(normalizeTeamInviteInput);
};
