import { db } from "@faworra-new/db";
import { userContext } from "@faworra-new/db/schema/core";
import { teamSettings, teams, usersOnTeam } from "@faworra-new/db/schema/team";

import {
	DEFAULT_INDUSTRY_CONFIG_VERSION,
	DEFAULT_INDUSTRY_KEY,
	type OnboardingInput,
} from "../onboarding";

const mapViewerStateFromMembership = (
	membership: {
		role: typeof usersOnTeam.$inferSelect.role;
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

const findMembershipByTeam = (userId: string, teamId: string) => {
	return db.query.usersOnTeam.findFirst({
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
	return db.query.usersOnTeam.findFirst({
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
		const existingMembership = await tx.query.usersOnTeam.findFirst({
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
					activeTeamId: existingMembership.teamId,
				})
				.onConflictDoUpdate({
					target: userContext.userId,
					set: {
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

		await tx.insert(usersOnTeam).values({
			userId,
			teamId: team.id,
			role: "owner",
		});

		const [settings] = await tx
			.insert(teamSettings)
			.values({
				teamId: team.id,
				baseCurrency: input.baseCurrency,
				countryCode: input.countryCode,
				industryKey: DEFAULT_INDUSTRY_KEY,
				industryConfigVersion: DEFAULT_INDUSTRY_CONFIG_VERSION,
			})
			.returning();

		await tx
			.insert(userContext)
			.values({
				userId,
				activeTeamId: team.id,
			})
			.onConflictDoUpdate({
				target: userContext.userId,
				set: {
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
