import { db } from "@faworra-new/db";
import { userContext } from "@faworra-new/db/schema/core";
import {
	teamMemberships,
	teamSettings,
	teams,
} from "@faworra-new/db/schema/team";
import { TRPCError } from "@trpc/server";

import type { OnboardingInput } from "../onboarding";

export const mapViewerStateFromMembership = (
	membership: {
		id: string;
		role: typeof teamMemberships.$inferSelect.role;
		teamId: string;
		team: {
			id: string;
			name: string;
			logoUrl: string | null;
			settings?: {
				baseCurrency: string | null;
				countryCode: string | null;
				fiscalYearStartMonth: number | null;
				industryKey: string | null;
				industryConfigVersion: string | null;
			} | null;
		};
	} | null
) => {
	if (!membership) {
		return {
			activeTeam: null,
			membership: null,
			needsOnboarding: true,
		};
	}

	return {
		activeTeam: {
			id: membership.team.id,
			name: membership.team.name,
			logoUrl: membership.team.logoUrl,
			settings: membership.team.settings
				? {
						baseCurrency: membership.team.settings.baseCurrency,
						countryCode: membership.team.settings.countryCode,
						fiscalYearStartMonth: membership.team.settings.fiscalYearStartMonth,
						industryKey: membership.team.settings.industryKey,
						industryConfigVersion:
							membership.team.settings.industryConfigVersion,
					}
				: null,
		},
		membership: {
			role: membership.role,
			teamId: membership.teamId,
		},
		needsOnboarding: false,
	};
};

const findMembershipById = (userId: string, membershipId: string) => {
	return db.query.teamMemberships.findFirst({
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

const findMembershipByTeam = (userId: string, teamId: string) => {
	return db.query.teamMemberships.findFirst({
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

const findFirstMembership = (userId: string) => {
	return db.query.teamMemberships.findFirst({
		where: (table, { eq }) => eq(table.userId, userId),
		orderBy: (table, { asc: orderAsc }) => [orderAsc(table.createdAt)],
		with: {
			team: {
				with: {
					settings: true,
				},
			},
		},
	});
};

export const getViewerState = async (userId: string) => {
	const context = await db.query.userContext.findFirst({
		where: (table, { eq }) => eq(table.userId, userId),
	});

	if (context?.activeMembershipId) {
		const activeMembership = await findMembershipById(
			userId,
			context.activeMembershipId
		);
		if (activeMembership) {
			return mapViewerStateFromMembership(activeMembership);
		}
	}

	if (context?.activeTeamId) {
		const activeMembership = await findMembershipByTeam(
			userId,
			context.activeTeamId
		);
		if (activeMembership) {
			return mapViewerStateFromMembership(activeMembership);
		}
	}

	const firstMembership = await findFirstMembership(userId);
	return mapViewerStateFromMembership(firstMembership ?? null);
};

export const completeOnboarding = (userId: string, input: OnboardingInput) => {
	return db.transaction(async (tx) => {
		const existingMembership = await tx.query.teamMemberships.findFirst({
			where: (table, { eq }) => eq(table.userId, userId),
			orderBy: (table, { asc }) => [asc(table.createdAt)],
			with: {
				team: {
					with: {
						settings: true,
					},
				},
			},
		});

		if (existingMembership) {
			await tx
				.insert(userContext)
				.values({
					userId,
					activeMembershipId: existingMembership.id,
					activeTeamId: existingMembership.teamId,
				})
				.onConflictDoUpdate({
					target: userContext.userId,
					set: {
						activeMembershipId: existingMembership.id,
						activeTeamId: existingMembership.teamId,
						updatedAt: new Date(),
					},
				});

			return mapViewerStateFromMembership(existingMembership);
		}

		const [team] = await tx
			.insert(teams)
			.values({
				name: input.companyName,
			})
			.returning();

		if (!team) {
			throw new Error("Failed to create team");
		}

		const [membership] = await tx
			.insert(teamMemberships)
			.values({
				userId,
				teamId: team.id,
				role: "owner",
			})
			.returning();

		if (!membership) {
			throw new Error("Failed to create team membership");
		}

		const [settings] = await tx
			.insert(teamSettings)
			.values({
				teamId: team.id,
				baseCurrency: input.baseCurrency,
				countryCode: input.countryCode,
				industryKey: null,
				industryConfigVersion: null,
			})
			.returning();

		if (!settings) {
			throw new Error("Failed to create team settings");
		}

		await tx
			.insert(userContext)
			.values({
				userId,
				activeMembershipId: membership.id,
				activeTeamId: team.id,
			})
			.onConflictDoUpdate({
				target: userContext.userId,
				set: {
					activeMembershipId: membership.id,
					activeTeamId: team.id,
					updatedAt: new Date(),
				},
			});

		return {
			activeTeam: {
				id: team.id,
				name: team.name,
				logoUrl: team.logoUrl,
				settings: {
					baseCurrency: settings.baseCurrency,
					countryCode: settings.countryCode,
					fiscalYearStartMonth: settings.fiscalYearStartMonth,
					industryKey: settings.industryKey,
					industryConfigVersion: settings.industryConfigVersion,
				},
			},
			membership: {
				role: "owner" as const,
				teamId: team.id,
			},
			needsOnboarding: false,
		};
	});
};

/**
 * Returns all accepted memberships for a user with metadata needed
 * for the workspace switcher (membershipId, teamId, name, logoUrl, role).
 * Only accepted memberships are stored in team_memberships per the tenancy model.
 */
export const getTeamList = async (userId: string) => {
	const memberships = await db.query.teamMemberships.findMany({
		where: (table, { eq }) => eq(table.userId, userId),
		orderBy: (table, { asc }) => [asc(table.createdAt)],
		with: {
			team: true,
		},
	});

	return memberships.map((m) => ({
		membershipId: m.id,
		teamId: m.teamId,
		name: m.team.name,
		logoUrl: m.team.logoUrl,
		role: m.role,
	}));
};

/**
 * Switches the active workspace for a user by membershipId.
 * Validates that the user actually holds the given membership before updating.
 * Rejects invalid switches without mutating the current workspace context.
 * Uses activeMembershipId as the source of truth per the membership-first invariant.
 */
export const switchTeam = async (userId: string, membershipId: string) => {
	const membership = await db.query.teamMemberships.findFirst({
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

	if (!membership) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not a member of this team",
		});
	}

	await db
		.insert(userContext)
		.values({
			userId,
			activeMembershipId: membership.id,
			activeTeamId: membership.teamId,
		})
		.onConflictDoUpdate({
			target: userContext.userId,
			set: {
				activeMembershipId: membership.id,
				activeTeamId: membership.teamId,
				updatedAt: new Date(),
			},
		});

	return mapViewerStateFromMembership(membership);
};
