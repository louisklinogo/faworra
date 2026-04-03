import { beforeEach, describe, expect, it, mock } from "bun:test";

import { userContext } from "@faworra-new/db/schema/core";
import { teamInvites, teamMemberships } from "@faworra-new/db/schema/team";

import {
	DEFAULT_INDUSTRY_CONFIG_VERSION,
	DEFAULT_INDUSTRY_KEY,
} from "../onboarding";

type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

interface TeamInviteRecord {
	acceptedAt: Date | null;
	acceptedByUserId: string | null;
	createdAt: Date;
	email: string;
	expiresAt: Date;
	id: string;
	invitedByUser?: {
		email: string;
		id: string;
		name: string;
	} | null;
	invitedByUserId: string;
	normalizedEmail: string;
	role: "owner" | "member";
	status: InviteStatus;
	team?: {
		id: string;
		logoUrl: string | null;
		name: string;
	} | null;
	teamId: string;
	tokenHash: string;
	updatedAt: Date;
}

interface MembershipWithTeam {
	id: string;
	role: "owner" | "member";
	team: {
		id: string;
		name: string;
		logoUrl: string | null;
		settings: {
			baseCurrency: string | null;
			countryCode: string | null;
			fiscalYearStartMonth: number | null;
			industryKey: string | null;
			industryConfigVersion: string | null;
		};
	};
	teamId: string;
}

interface TeamMemberRecord {
	user: {
		email: string | null;
	} | null;
}

const createInvite = (
	overrides?: Partial<TeamInviteRecord>
): TeamInviteRecord => ({
	id: "invite_1",
	teamId: "team_1",
	email: "buyer@example.com",
	normalizedEmail: "buyer@example.com",
	role: "member",
	status: "pending",
	tokenHash: "token_hash_1",
	invitedByUserId: "owner_1",
	invitedByUser: {
		id: "owner_1",
		name: "Owner",
		email: "owner@example.com",
	},
	team: {
		id: "team_1",
		name: "Maison Paco",
		logoUrl: null,
	},
	acceptedByUserId: null,
	expiresAt: new Date("2030-01-01T00:00:00.000Z"),
	acceptedAt: null,
	createdAt: new Date("2026-03-11T00:00:00.000Z"),
	updatedAt: new Date("2026-03-11T00:00:00.000Z"),
	...overrides,
});

const createMembership = (
	overrides?: Partial<MembershipWithTeam>
): MembershipWithTeam => ({
	id: "membership_1",
	role: "member",
	teamId: "team_1",
	team: {
		id: "team_1",
		name: "Maison Paco",
		logoUrl: null,
		settings: {
			baseCurrency: "EUR",
			countryCode: "FR",
			fiscalYearStartMonth: null,
			industryKey: DEFAULT_INDUSTRY_KEY,
			industryConfigVersion: DEFAULT_INDUSTRY_CONFIG_VERSION,
		},
	},
	...overrides,
});

const state = {
	listResult: [] as TeamInviteRecord[],
	inviteLookupQueue: [] as Array<TeamInviteRecord | null>,
	pendingInvitesForCreate: [] as TeamInviteRecord[],
	teamMembersForCreate: [] as TeamMemberRecord[],
	membershipLookupQueue: [] as Array<MembershipWithTeam | null>,
	createdInviteQueue: [createInvite()],
	createdMembershipRows: [
		{
			id: "membership_new",
			userId: "user_1",
			teamId: "team_1",
			role: "member",
		},
	],
	updatedInviteQueue: [createInvite({ status: "revoked" })],
	insertedValues: [] as Array<{ table: string; values: unknown }>,
	updatedValues: [] as Array<{ table: string; values: unknown }>,
	upsertCalls: [] as Array<{ table: string; config: unknown }>,
};

const getTableName = (table: unknown): string => {
	if (table === teamInvites) {
		return "teamInvites";
	}

	if (table === teamMemberships) {
		return "teamMemberships";
	}

	if (table === userContext) {
		return "userContext";
	}

	throw new Error("Unexpected table in mocked DB interaction");
};

const txMock = {
	query: {
		teamInvites: {
			findFirst: async () => state.inviteLookupQueue.shift() ?? null,
			findMany: async () => state.pendingInvitesForCreate,
		},
		teamMemberships: {
			findFirst: async () => state.membershipLookupQueue.shift() ?? null,
			findMany: async () => state.teamMembersForCreate,
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
					if (table === teamInvites) {
						const nextInvite = state.createdInviteQueue.shift();

						if (!nextInvite) {
							throw new Error("No mocked created invite available");
						}

						return [nextInvite];
					}

					if (table === teamMemberships) {
						return state.createdMembershipRows;
					}

					throw new Error(`Unexpected returning() call for ${tableName}`);
				},
			};
		},
	}),
	update: (table: unknown) => ({
		set: (values: unknown) => {
			state.updatedValues.push({ table: getTableName(table), values });

			return {
				where: () => ({
					returning: () => {
						const nextInvite = state.updatedInviteQueue.shift();
						return nextInvite ? [nextInvite] : [];
					},
				}),
			};
		},
	}),
};

const dbMock = {
	query: {
		teamInvites: {
			findMany: async () => state.listResult,
		},
	},
	transaction: (callback: (transaction: typeof txMock) => Promise<unknown>) => {
		return callback(txMock);
	},
};

mock.module("@faworra-new/db", () => ({
	db: dbMock,
}));

const {
	acceptTeamInvite,
	createTeamInvites,
	declineTeamInvite,
	deleteTeamInvite,
	listInvitesByEmail,
	listTeamInvites,
} = await import("./team-invites");

beforeEach(() => {
	state.listResult = [];
	state.inviteLookupQueue = [];
	state.pendingInvitesForCreate = [];
	state.teamMembersForCreate = [];
	state.membershipLookupQueue = [];
	state.createdInviteQueue = [createInvite()];
	state.createdMembershipRows = [
		{
			id: "membership_new",
			userId: "user_1",
			teamId: "team_1",
			role: "member",
		},
	];
	state.updatedInviteQueue = [createInvite({ status: "revoked" })];
	state.insertedValues = [];
	state.updatedValues = [];
	state.upsertCalls = [];
});

describe("listTeamInvites", () => {
	it("returns only active pending invites without token hashes", async () => {
		state.listResult = [
			createInvite(),
			createInvite({
				id: "invite_expired",
				expiresAt: new Date("2020-01-01T00:00:00.000Z"),
			}),
		];

		await expect(listTeamInvites("team_1")).resolves.toEqual([
			expect.objectContaining({
				id: "invite_1",
				email: "buyer@example.com",
				status: "pending",
			}),
		]);
	});
});

describe("listInvitesByEmail", () => {
	it("returns the signed-in user's active invite inbox", async () => {
		state.listResult = [
			createInvite(),
			createInvite({
				id: "invite_expired",
				expiresAt: new Date("2020-01-01T00:00:00.000Z"),
			}),
		];

		await expect(listInvitesByEmail("buyer@example.com")).resolves.toEqual([
			expect.objectContaining({
				id: "invite_1",
				team: {
					id: "team_1",
					name: "Maison Paco",
					logoUrl: null,
				},
			}),
		]);
	});
});

describe("createTeamInvites", () => {
	it("matches Midday-style bulk invite behavior by skipping duplicates and existing users", async () => {
		state.teamMembersForCreate = [{ user: { email: "member@example.com" } }];
		state.pendingInvitesForCreate = [
			createInvite({
				id: "invite_pending",
				email: "pending@example.com",
				normalizedEmail: "pending@example.com",
			}),
		];
		state.createdInviteQueue = [
			createInvite({
				id: "invite_fresh",
				email: "fresh@example.com",
				normalizedEmail: "fresh@example.com",
			}),
			createInvite({
				id: "invite_owner",
				email: "ownerinvite@example.com",
				normalizedEmail: "ownerinvite@example.com",
				role: "owner",
			}),
		];

		await expect(
			createTeamInvites({
				teamId: "team_1",
				invitedByUserId: "owner_1",
				invites: [
					{ email: "fresh@example.com", role: "member" },
					{ email: "Fresh@Example.com", role: "member" },
					{ email: "member@example.com", role: "member" },
					{ email: "pending@example.com", role: "member" },
					{ email: "ownerinvite@example.com", role: "owner" },
				],
			})
		).resolves.toEqual({
			created: [
				expect.objectContaining({
					id: "invite_fresh",
					email: "fresh@example.com",
				}),
				expect.objectContaining({
					id: "invite_owner",
					email: "ownerinvite@example.com",
					role: "owner",
				}),
			],
			sent: 2,
			skipped: 3,
			skippedInvites: [
				{ email: "fresh@example.com", reason: "duplicate" },
				{ email: "member@example.com", reason: "already_member" },
				{ email: "pending@example.com", reason: "already_invited" },
			],
		});

		expect(state.insertedValues).toEqual([
			{
				table: "teamInvites",
				values: expect.objectContaining({
					teamId: "team_1",
					email: "fresh@example.com",
					normalizedEmail: "fresh@example.com",
					role: "member",
				}),
			},
			{
				table: "teamInvites",
				values: expect.objectContaining({
					teamId: "team_1",
					email: "ownerinvite@example.com",
					normalizedEmail: "ownerinvite@example.com",
					role: "owner",
				}),
			},
		]);
	});
});

describe("deleteTeamInvite", () => {
	it("marks a pending invite as revoked for owner-side deletion", async () => {
		state.updatedInviteQueue = [createInvite({ status: "revoked" })];

		await expect(
			deleteTeamInvite({
				teamId: "team_1",
				inviteId: "invite_1",
			})
		).resolves.toEqual(
			expect.objectContaining({
				id: "invite_1",
				status: "revoked",
			})
		);
	});
});

describe("declineTeamInvite", () => {
	it("marks a pending invite as revoked for the invited user", async () => {
		state.updatedInviteQueue = [createInvite({ status: "revoked" })];

		await expect(
			declineTeamInvite({
				inviteId: "invite_1",
				userEmail: "buyer@example.com",
			})
		).resolves.toEqual(
			expect.objectContaining({
				id: "invite_1",
				status: "revoked",
			})
		);
	});
});

describe("acceptTeamInvite", () => {
	it("accepts an invite by id, creates membership if needed, and activates it", async () => {
		state.inviteLookupQueue = [createInvite({ id: "invite_1" })];
		state.membershipLookupQueue = [
			null,
			createMembership({ id: "membership_new" }),
		];

		await expect(
			acceptTeamInvite({
				inviteId: "invite_1",
				userId: "user_1",
				userEmail: "buyer@example.com",
			})
		).resolves.toEqual({
			activeTeam: {
				id: "team_1",
				name: "Maison Paco",
				logoUrl: null,
				settings: {
					baseCurrency: "EUR",
					countryCode: "FR",
					fiscalYearStartMonth: null,
					industryKey: DEFAULT_INDUSTRY_KEY,
					industryConfigVersion: DEFAULT_INDUSTRY_CONFIG_VERSION,
				},
			},
			membership: {
				role: "member",
				teamId: "team_1",
			},
			needsOnboarding: false,
		});

		expect(state.insertedValues).toEqual([
			{
				table: "teamMemberships",
				values: {
					userId: "user_1",
					teamId: "team_1",
					role: "member",
				},
			},
			{
				table: "userContext",
				values: {
					userId: "user_1",
					activeMembershipId: "membership_new",
					activeTeamId: "team_1",
				},
			},
		]);
		expect(state.updatedValues[0]).toEqual({
			table: "teamInvites",
			values: expect.objectContaining({
				status: "accepted",
				acceptedByUserId: "user_1",
			}),
		});
		expect(state.upsertCalls).toHaveLength(1);
	});

	it("is idempotent when the same user re-accepts an already accepted invite", async () => {
		state.inviteLookupQueue = [
			createInvite({
				status: "accepted",
				acceptedByUserId: "user_1",
			}),
		];
		state.membershipLookupQueue = [createMembership()];

		await expect(
			acceptTeamInvite({
				inviteId: "invite_1",
				userId: "user_1",
				userEmail: "buyer@example.com",
			})
		).resolves.toEqual(
			expect.objectContaining({
				needsOnboarding: false,
			})
		);
		expect(state.updatedValues).toHaveLength(0);
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
	});

	it("rejects invite acceptance when the signed-in email does not match", async () => {
		state.inviteLookupQueue = [createInvite({ id: "invite_1" })];

		await expect(
			acceptTeamInvite({
				inviteId: "invite_1",
				userId: "user_1",
				userEmail: "other@example.com",
			})
		).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "This invite is for a different email address",
		});
	});
});
