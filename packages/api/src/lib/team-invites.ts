import { createHash, randomUUID } from "node:crypto";
import { and, db, eq } from "@faworra-new/db";
import { userContext } from "@faworra-new/db/schema/core";
import { teamInvites, teamMemberships } from "@faworra-new/db/schema/team";
import { TRPCError } from "@trpc/server";

import {
	type CreateTeamInvitesInput,
	TEAM_INVITE_TTL_DAYS,
} from "../team-invites";
import { mapViewerStateFromMembership } from "./team";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type TeamInviteRecord = typeof teamInvites.$inferSelect;
type TeamInviteRole = typeof teamMemberships.$inferSelect.role;
export type SkippedInviteReason =
	| "already_invited"
	| "already_member"
	| "duplicate";

interface CreateInviteCandidate {
	email: string;
	role: TeamInviteRole;
}

export interface SkippedInvite {
	email: string;
	reason: SkippedInviteReason;
}

export const normalizeInviteEmail = (email: string): string =>
	email.trim().toLowerCase();

const hashInviteToken = (token: string): string =>
	createHash("sha256").update(token).digest("hex");

const createInviteExpiryDate = (): Date =>
	new Date(Date.now() + TEAM_INVITE_TTL_DAYS * DAY_IN_MS);

const isInviteExpired = (
	invite: Pick<TeamInviteRecord, "expiresAt">,
	now: Date
) => {
	return invite.expiresAt.getTime() <= now.getTime();
};

const isActivePendingInvite = (
	invite: Pick<TeamInviteRecord, "expiresAt" | "status">,
	now: Date
) => {
	return invite.status === "pending" && !isInviteExpired(invite, now);
};

const mapTeamInvite = <TInvite extends { tokenHash: string }>(
	invite: TInvite
): Omit<TInvite, "tokenHash"> => {
	const { tokenHash: _tokenHash, ...safeInvite } = invite;

	return safeInvite;
};

const filterActivePendingInvites = <TInvite extends TeamInviteRecord>(
	invites: TInvite[],
	now: Date
) => invites.filter((invite) => isActivePendingInvite(invite, now));

const collectUniqueInviteCandidates = (invites: CreateTeamInvitesInput) => {
	const seenEmails = new Set<string>();
	const candidates: CreateInviteCandidate[] = [];
	const skippedInvites: SkippedInvite[] = [];

	for (const invite of invites) {
		const normalizedEmail = normalizeInviteEmail(invite.email);

		if (seenEmails.has(normalizedEmail)) {
			skippedInvites.push({
				email: normalizedEmail,
				reason: "duplicate",
			});
			continue;
		}

		seenEmails.add(normalizedEmail);
		candidates.push({
			email: normalizedEmail,
			role: invite.role,
		});
	}

	return { candidates, skippedInvites };
};

const expireInvitesIfNeeded = async (
	transaction: Transaction,
	invites: TeamInviteRecord[],
	now: Date
) => {
	const expiredInviteIds = invites
		.filter(
			(invite) => invite.status === "pending" && isInviteExpired(invite, now)
		)
		.map((invite) => invite.id);

	if (expiredInviteIds.length === 0) {
		return;
	}

	for (const inviteId of expiredInviteIds) {
		await transaction
			.update(teamInvites)
			.set({
				status: "expired",
				updatedAt: now,
			})
			.where(eq(teamInvites.id, inviteId));
	}
};

const getPendingInvitesForTeam = async (
	transaction: Transaction,
	teamId: string
) => {
	const pendingInvites = await transaction.query.teamInvites.findMany({
		where: (table, { and, eq }) =>
			and(eq(table.teamId, teamId), eq(table.status, "pending")),
	});

	const now = new Date();
	await expireInvitesIfNeeded(transaction, pendingInvites, now);

	return filterActivePendingInvites(pendingInvites, now);
};

const getTeamMemberEmails = async (
	transaction: Transaction,
	teamId: string
) => {
	const memberships = await transaction.query.teamMemberships.findMany({
		where: (table, { eq }) => eq(table.teamId, teamId),
		with: {
			user: {
				columns: {
					email: true,
				},
			},
		},
	});

	return new Set(
		memberships
			.map((membership) => membership.user?.email)
			.filter((email): email is string => Boolean(email))
			.map(normalizeInviteEmail)
	);
};

const getMembershipWithTeamById = (
	transaction: Transaction,
	userId: string,
	membershipId: string
) => {
	return transaction.query.teamMemberships.findFirst({
		where: (table, { and, eq }) =>
			and(eq(table.userId, userId), eq(table.id, membershipId)),
		with: {
			team: {
				with: {
					settings: true,
				},
			},
		},
	});
};

const getMembershipWithTeamByTeamId = (
	transaction: Transaction,
	userId: string,
	teamId: string
) => {
	return transaction.query.teamMemberships.findFirst({
		where: (table, { and, eq }) =>
			and(eq(table.userId, userId), eq(table.teamId, teamId)),
		with: {
			team: {
				with: {
					settings: true,
				},
			},
		},
	});
};

const getInviteById = async (
	transaction: Transaction,
	inviteId: string,
	userEmail: string
) => {
	const invite = await transaction.query.teamInvites.findFirst({
		where: (table, { eq }) => eq(table.id, inviteId),
	});

	if (!invite) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Invite not found",
		});
	}

	if (invite.normalizedEmail !== normalizeInviteEmail(userEmail)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "This invite is for a different email address",
		});
	}

	if (invite.status === "revoked") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This invite has been revoked",
		});
	}

	return invite;
};

const ensureInviteIsUsable = async (
	transaction: Transaction,
	invite: TeamInviteRecord,
	userId: string,
	now: Date
) => {
	const hasExpired =
		invite.status === "expired" ||
		(invite.status === "pending" && isInviteExpired(invite, now));

	if (hasExpired) {
		if (invite.status === "pending") {
			await transaction
				.update(teamInvites)
				.set({
					status: "expired",
					updatedAt: now,
				})
				.where(eq(teamInvites.id, invite.id));
		}

		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This invite has expired",
		});
	}

	if (
		invite.status === "accepted" &&
		invite.acceptedByUserId &&
		invite.acceptedByUserId !== userId
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This invite has already been accepted",
		});
	}
};

const ensureMembershipForInvite = async (
	transaction: Transaction,
	invite: Pick<TeamInviteRecord, "role" | "teamId">,
	userId: string
) => {
	let membership = await getMembershipWithTeamByTeamId(
		transaction,
		userId,
		invite.teamId
	);

	if (!membership) {
		const [createdMembership] = await transaction
			.insert(teamMemberships)
			.values({
				userId,
				teamId: invite.teamId,
				role: invite.role,
			})
			.returning();

		if (!createdMembership) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create membership",
			});
		}

		membership = await getMembershipWithTeamById(
			transaction,
			userId,
			createdMembership.id
		);
	}

	if (!membership) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Accepted membership could not be resolved",
		});
	}

	return membership;
};

export const listTeamInvites = async (teamId: string) => {
	const invites = await db.query.teamInvites.findMany({
		where: (table, { and, eq }) =>
			and(eq(table.teamId, teamId), eq(table.status, "pending")),
		orderBy: (table, { desc }) => [desc(table.createdAt)],
		with: {
			invitedByUser: {
				columns: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	return filterActivePendingInvites(invites, new Date()).map(mapTeamInvite);
};

export const listInvitesByEmail = async (userEmail: string) => {
	const normalizedEmail = normalizeInviteEmail(userEmail);
	const invites = await db.query.teamInvites.findMany({
		where: (table, { and, eq }) =>
			and(
				eq(table.normalizedEmail, normalizedEmail),
				eq(table.status, "pending")
			),
		orderBy: (table, { desc }) => [desc(table.createdAt)],
		with: {
			team: {
				columns: {
					id: true,
					name: true,
					logoUrl: true,
				},
			},
			invitedByUser: {
				columns: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	return filterActivePendingInvites(invites, new Date()).map(mapTeamInvite);
};

export const createTeamInvites = (input: {
	teamId: string;
	invitedByUserId: string;
	invites: CreateTeamInvitesInput;
}) => {
	return db.transaction(async (tx) => {
		const { candidates, skippedInvites } = collectUniqueInviteCandidates(
			input.invites
		);
		const existingMemberEmails = await getTeamMemberEmails(tx, input.teamId);
		const existingPendingInvites = await getPendingInvitesForTeam(
			tx,
			input.teamId
		);
		const existingPendingEmails = new Set(
			existingPendingInvites.map((invite) => invite.normalizedEmail)
		);
		const created: Omit<TeamInviteRecord, "tokenHash">[] = [];

		for (const invite of candidates) {
			if (existingMemberEmails.has(invite.email)) {
				skippedInvites.push({
					email: invite.email,
					reason: "already_member",
				});
				continue;
			}

			if (existingPendingEmails.has(invite.email)) {
				skippedInvites.push({
					email: invite.email,
					reason: "already_invited",
				});
				continue;
			}

			const token = randomUUID();
			const [createdInvite] = await tx
				.insert(teamInvites)
				.values({
					teamId: input.teamId,
					email: invite.email,
					normalizedEmail: invite.email,
					role: invite.role,
					status: "pending",
					tokenHash: hashInviteToken(token),
					invitedByUserId: input.invitedByUserId,
					expiresAt: createInviteExpiryDate(),
				})
				.returning();

			if (!createdInvite) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create invite",
				});
			}

			created.push(mapTeamInvite(createdInvite));
			existingPendingEmails.add(invite.email);
		}

		return {
			created,
			sent: created.length,
			skipped: skippedInvites.length,
			skippedInvites,
		};
	});
};

export const deleteTeamInvite = (input: {
	teamId: string;
	inviteId: string;
}) => {
	return db.transaction(async (tx) => {
		const [invite] = await tx
			.update(teamInvites)
			.set({
				status: "revoked",
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(teamInvites.id, input.inviteId),
					eq(teamInvites.teamId, input.teamId),
					eq(teamInvites.status, "pending")
				)
			)
			.returning();

		if (!invite) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Pending invite not found",
			});
		}

		return mapTeamInvite(invite);
	});
};

export const declineTeamInvite = (input: {
	inviteId: string;
	userEmail: string;
}) => {
	return db.transaction(async (tx) => {
		const normalizedEmail = normalizeInviteEmail(input.userEmail);
		const [invite] = await tx
			.update(teamInvites)
			.set({
				status: "revoked",
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(teamInvites.id, input.inviteId),
					eq(teamInvites.normalizedEmail, normalizedEmail),
					eq(teamInvites.status, "pending")
				)
			)
			.returning();

		if (!invite) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Pending invite not found",
			});
		}

		return mapTeamInvite(invite);
	});
};

export const acceptTeamInvite = (input: {
	inviteId: string;
	userId: string;
	userEmail: string;
}) => {
	return db.transaction(async (tx) => {
		const invite = await getInviteById(tx, input.inviteId, input.userEmail);
		const now = new Date();
		await ensureInviteIsUsable(tx, invite, input.userId, now);
		const membership = await ensureMembershipForInvite(
			tx,
			invite,
			input.userId
		);

		if (invite.status === "pending") {
			await tx
				.update(teamInvites)
				.set({
					status: "accepted",
					acceptedAt: now,
					acceptedByUserId: input.userId,
					updatedAt: now,
				})
				.where(eq(teamInvites.id, invite.id));
		}

		await tx
			.insert(userContext)
			.values({
				userId: input.userId,
				activeMembershipId: membership.id,
				activeTeamId: membership.teamId,
			})
			.onConflictDoUpdate({
				target: userContext.userId,
				set: {
					activeMembershipId: membership.id,
					activeTeamId: membership.teamId,
					updatedAt: now,
				},
			});

		return mapViewerStateFromMembership(membership);
	});
};
