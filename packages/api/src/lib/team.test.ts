import { beforeEach, describe, expect, it, mock } from "bun:test";

import { userContext } from "@faworra-new/db/schema/core";
import {
	teamMemberships,
	teamSettings,
	teams,
} from "@faworra-new/db/schema/team";

import type { OnboardingInput } from "../onboarding";

interface Membership {
	id: string;
	role: "owner" | "member";
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
	teamId: string;
}

interface UserContextValue {
	activeMembershipId?: string | null;
	activeTeamId: string | null;
}

type UserContextRow = UserContextValue | null;

const onboardingInput: OnboardingInput = {
	companyName: "Akwa Trading",
	baseCurrency: "EUR",
	countryCode: "FR",
};

const createMembership = (overrides?: Partial<Membership>): Membership => ({
	id: "membership_1",
	role: "owner",
	teamId: "team_1",
	team: {
		id: "team_1",
		name: "Akwa Trading",
		logoUrl: null,
		settings: {
			baseCurrency: "EUR",
			countryCode: "FR",
			fiscalYearStartMonth: null,
			industryKey: null,
			industryConfigVersion: null,
		},
	},
	...overrides,
});

const state = {
	userContextResult: null as UserContextRow,
	activeMembershipResult: null as Membership | null,
	firstMembershipResult: null as Membership | null,
	existingMembershipResult: null as Membership | null,
	teamListResult: [] as Membership[],
	createdMembership: [
		{
			id: "membership_new",
			userId: "user_1",
			teamId: "team_new",
			role: "owner",
		},
	],
	insertedValues: [] as Array<{ table: string; values: unknown }>,
	upsertCalls: [] as Array<{ table: string; config: unknown }>,
	createdTeam: [{ id: "team_new", name: "Akwa Trading", logoUrl: null }],
	createdSettings: [
		{
			baseCurrency: "EUR",
			countryCode: "FR",
			fiscalYearStartMonth: null,
			industryKey: null,
			industryConfigVersion: null,
		},
	],
};

const getTableName = (table: unknown): string => {
	if (table === teams) {
		return "teams";
	}

	if (table === teamMemberships) {
		return "teamMemberships";
	}

	if (table === teamSettings) {
		return "teamSettings";
	}

	if (table === userContext) {
		return "userContext";
	}

	throw new Error("Unexpected table in mocked transaction");
};

const txMock = {
	query: {
		teamMemberships: {
			findFirst: async () => state.existingMembershipResult,
		},
	},
	insert: (table: unknown) => ({
		values: (values: unknown) => {
			const tableName = getTableName(table);
			state.insertedValues.push({ table: tableName, values });

			return {
				onConflictDoUpdate: (config: unknown) => {
					state.upsertCalls.push({ table: tableName, config });
				},
				returning: () => {
					if (table === teams) {
						return state.createdTeam;
					}

					if (table === teamSettings) {
						return state.createdSettings;
					}

					if (table === teamMemberships) {
						return state.createdMembership;
					}

					throw new Error(`Unexpected returning() call for ${tableName}`);
				},
			};
		},
	}),
};

const dbMock = {
	query: {
		userContext: {
			findFirst: async () => state.userContextResult,
		},
		teamMemberships: {
			findFirst: (query: { orderBy?: unknown }) => {
				return query.orderBy
					? state.firstMembershipResult
					: state.activeMembershipResult;
			},
			findMany: async () => state.teamListResult,
		},
	},
	insert: (table: unknown) => ({
		values: (values: unknown) => {
			const tableName = getTableName(table);
			state.insertedValues.push({ table: tableName, values });

			return {
				onConflictDoUpdate: (config: unknown) => {
					state.upsertCalls.push({ table: tableName, config });
				},
			};
		},
	}),
	transaction: (callback: (transaction: typeof txMock) => Promise<unknown>) => {
		return callback(txMock);
	},
};

mock.module("@faworra-new/db", () => ({
	db: dbMock,
	// Drizzle predicate stubs – included so the mock stays consistent with the
	// full @faworra-new/db shape when test files share a module registry.
	and: (..._args: unknown[]) => ({}),
	eq: (_a: unknown, _b: unknown) => ({}),
}));

const { completeOnboarding, getTeamList, getViewerState, switchTeam } =
	await import("./team");

beforeEach(() => {
	state.userContextResult = null;
	state.activeMembershipResult = null;
	state.firstMembershipResult = null;
	state.existingMembershipResult = null;
	state.teamListResult = [];
	state.createdMembership = [
		{
			id: "membership_new",
			userId: "user_1",
			teamId: "team_new",
			role: "owner",
		},
	];
	state.insertedValues = [];
	state.upsertCalls = [];
	state.createdTeam = [{ id: "team_new", name: "Akwa Trading", logoUrl: null }];
	state.createdSettings = [
		{
			baseCurrency: "EUR",
			countryCode: "FR",
			fiscalYearStartMonth: null,
			industryKey: null,
			industryConfigVersion: null,
		},
	];
});

describe("getViewerState", () => {
	it("returns needsOnboarding when the user has no membership", async () => {
		await expect(getViewerState("user_1")).resolves.toEqual({
			activeTeam: null,
			membership: null,
			needsOnboarding: true,
		});
	});

	it("prefers activeMembershipId before falling back to activeTeamId", async () => {
		state.userContextResult = {
			activeMembershipId: "membership_2",
			activeTeamId: "team_stale",
		};
		state.activeMembershipResult = createMembership({
			id: "membership_2",
			teamId: "team_active",
			team: {
				id: "team_active",
				name: "Active Membership Team",
				logoUrl: null,
				settings: {
					baseCurrency: "GBP",
					countryCode: "GB",
					fiscalYearStartMonth: 4,
					industryKey: null,
					industryConfigVersion: null,
				},
			},
		});

		await expect(getViewerState("user_1")).resolves.toEqual({
			activeTeam: {
				id: "team_active",
				name: "Active Membership Team",
				logoUrl: null,
				settings: {
					baseCurrency: "GBP",
					countryCode: "GB",
					fiscalYearStartMonth: 4,
					industryKey: null,
					industryConfigVersion: null,
				},
			},
			membership: {
				role: "owner",
				teamId: "team_active",
			},
			needsOnboarding: false,
		});
	});

	it("falls back to the first membership when activeTeamId is stale", async () => {
		state.userContextResult = { activeTeamId: "team_missing" };
		state.firstMembershipResult = createMembership({
			teamId: "team_fallback",
			team: {
				id: "team_fallback",
				name: "Fallback Team",
				logoUrl: null,
				settings: {
					baseCurrency: "USD",
					countryCode: "US",
					fiscalYearStartMonth: 1,
					industryKey: null,
					industryConfigVersion: null,
				},
			},
		});

		await expect(getViewerState("user_1")).resolves.toEqual({
			activeTeam: {
				id: "team_fallback",
				name: "Fallback Team",
				logoUrl: null,
				settings: {
					baseCurrency: "USD",
					countryCode: "US",
					fiscalYearStartMonth: 1,
					industryKey: null,
					industryConfigVersion: null,
				},
			},
			membership: {
				role: "owner",
				teamId: "team_fallback",
			},
			needsOnboarding: false,
		});
	});
});

describe("completeOnboarding", () => {
	it("activates an existing membership instead of creating a new team", async () => {
		state.existingMembershipResult = createMembership();

		await expect(
			completeOnboarding("user_1", onboardingInput)
		).resolves.toEqual({
			activeTeam: {
				id: "team_1",
				name: "Akwa Trading",
				logoUrl: null,
				settings: {
					baseCurrency: "EUR",
					countryCode: "FR",
					fiscalYearStartMonth: null,
					industryKey: null,
					industryConfigVersion: null,
				},
			},
			membership: {
				role: "owner",
				teamId: "team_1",
			},
			needsOnboarding: false,
		});

		expect(state.insertedValues).toEqual([
			{
				table: "userContext",
				values: {
					userId: "user_1",
					activeMembershipId: "membership_1",
					activeTeamId: "team_1",
				},
			},
		]);
		expect(state.upsertCalls).toHaveLength(1);
	});

	it("creates a default owner team, settings, and active team context", async () => {
		const result = await completeOnboarding("user_1", onboardingInput);

		expect(result).toEqual({
			activeTeam: {
				id: "team_new",
				name: "Akwa Trading",
				logoUrl: null,
				settings: {
					baseCurrency: "EUR",
					countryCode: "FR",
					fiscalYearStartMonth: null,
					industryKey: null,
					industryConfigVersion: null,
				},
			},
			membership: {
				role: "owner",
				teamId: "team_new",
			},
			needsOnboarding: false,
		});

		expect(state.insertedValues).toEqual([
			{
				table: "teams",
				values: {
					name: "Akwa Trading",
				},
			},
			{
				table: "teamMemberships",
				values: {
					userId: "user_1",
					teamId: "team_new",
					role: "owner",
				},
			},
			{
				table: "teamSettings",
				values: {
					teamId: "team_new",
					baseCurrency: "EUR",
					countryCode: "FR",
					industryKey: null,
					industryConfigVersion: null,
				},
			},
			{
				table: "userContext",
				values: {
					userId: "user_1",
					activeMembershipId: "membership_new",
					activeTeamId: "team_new",
				},
			},
		]);
		expect(state.upsertCalls).toHaveLength(1);
	});
});

describe("getTeamList", () => {
	it("returns an empty array when the user has no memberships", async () => {
		await expect(getTeamList("user_1")).resolves.toEqual([]);
	});

	it("returns switchable memberships with switcher metadata", async () => {
		state.teamListResult = [
			createMembership({
				id: "membership_1",
				role: "owner",
				teamId: "team_1",
				team: {
					id: "team_1",
					name: "Akwa Trading",
					logoUrl: null,
					settings: {
						baseCurrency: "EUR",
						countryCode: "FR",
						fiscalYearStartMonth: null,
						industryKey: null,
						industryConfigVersion: null,
					},
				},
			}),
			createMembership({
				id: "membership_2",
				role: "member",
				teamId: "team_2",
				team: {
					id: "team_2",
					name: "House of Lagos",
					logoUrl: "https://example.com/logo.png",
					settings: {
						baseCurrency: "NGN",
						countryCode: "NG",
						fiscalYearStartMonth: null,
						industryKey: null,
						industryConfigVersion: null,
					},
				},
			}),
		];

		await expect(getTeamList("user_1")).resolves.toEqual([
			{
				membershipId: "membership_1",
				teamId: "team_1",
				name: "Akwa Trading",
				logoUrl: null,
				role: "owner",
			},
			{
				membershipId: "membership_2",
				teamId: "team_2",
				name: "House of Lagos",
				logoUrl: "https://example.com/logo.png",
				role: "member",
			},
		]);
	});
});

describe("switchTeam", () => {
	it("activates a valid membership and updates userContext", async () => {
		state.activeMembershipResult = createMembership({
			id: "membership_1",
			role: "owner",
			teamId: "team_1",
			team: {
				id: "team_1",
				name: "Akwa Trading",
				logoUrl: null,
				settings: {
					baseCurrency: "EUR",
					countryCode: "FR",
					fiscalYearStartMonth: null,
					industryKey: null,
					industryConfigVersion: null,
				},
			},
		});

		await expect(switchTeam("user_1", "membership_1")).resolves.toEqual({
			activeTeam: {
				id: "team_1",
				name: "Akwa Trading",
				logoUrl: null,
				settings: {
					baseCurrency: "EUR",
					countryCode: "FR",
					fiscalYearStartMonth: null,
					industryKey: null,
					industryConfigVersion: null,
				},
			},
			membership: {
				role: "owner",
				teamId: "team_1",
			},
			needsOnboarding: false,
		});

		expect(state.insertedValues).toEqual([
			{
				table: "userContext",
				values: {
					userId: "user_1",
					activeMembershipId: "membership_1",
					activeTeamId: "team_1",
				},
			},
		]);
		expect(state.upsertCalls).toHaveLength(1);
	});

	it("invalid switch target leaves previous workspace active", async () => {
		// activeMembershipResult is null — the membership doesn't belong to the user
		await expect(switchTeam("user_1", "membership_other")).rejects.toThrow(
			"You are not a member of this team"
		);

		// No mutations should have occurred
		expect(state.insertedValues).toHaveLength(0);
		expect(state.upsertCalls).toHaveLength(0);
	});

	it("activeMembershipId wins over conflicting activeTeamId on stale-pointer scenario", async () => {
		// Set up: activeMembershipId points to a valid membership, activeTeamId is stale
		state.userContextResult = {
			activeMembershipId: "membership_2",
			activeTeamId: "team_stale",
		};
		state.activeMembershipResult = createMembership({
			id: "membership_2",
			teamId: "team_active",
			team: {
				id: "team_active",
				name: "Active Membership Team",
				logoUrl: null,
				settings: {
					baseCurrency: "GBP",
					countryCode: "GB",
					fiscalYearStartMonth: 4,
					industryKey: null,
					industryConfigVersion: null,
				},
			},
		});

		// getViewerState should resolve via activeMembershipId precedence
		await expect(getViewerState("user_1")).resolves.toEqual({
			activeTeam: {
				id: "team_active",
				name: "Active Membership Team",
				logoUrl: null,
				settings: {
					baseCurrency: "GBP",
					countryCode: "GB",
					fiscalYearStartMonth: 4,
					industryKey: null,
					industryConfigVersion: null,
				},
			},
			membership: {
				role: "owner",
				teamId: "team_active",
			},
			needsOnboarding: false,
		});
	});
});
