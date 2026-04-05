import { describe, expect, it } from "bun:test";

import { resolveTeamSwitcherState, type TeamEntry } from "./team-switcher";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeTeam = (overrides: Partial<TeamEntry> = {}): TeamEntry => ({
	membershipId: "mem-a",
	teamId: "team-a",
	name: "Acme",
	logoUrl: null,
	role: "owner",
	...overrides,
});

const teamA = makeTeam({
	membershipId: "mem-a",
	teamId: "team-a",
	name: "Acme",
});
const teamB = makeTeam({
	membershipId: "mem-b",
	teamId: "team-b",
	name: "Bravo",
	role: "member",
});
const teamC = makeTeam({
	membershipId: "mem-c",
	teamId: "team-c",
	name: "Charlie",
	role: "member",
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("resolveTeamSwitcherState", () => {
	describe("empty / unresolved state", () => {
		it("returns empty state when teams list is empty", () => {
			const state = resolveTeamSwitcherState([], "team-a");
			expect(state.currentTeam).toBeNull();
			expect(state.otherTeams).toEqual([]);
			expect(state.isMultiTeam).toBe(false);
		});

		it("returns empty state when activeTeamId is null", () => {
			const state = resolveTeamSwitcherState([teamA], null);
			expect(state.currentTeam).toBeNull();
			expect(state.otherTeams).toEqual([]);
			expect(state.isMultiTeam).toBe(false);
		});

		it("returns empty state when activeTeamId is undefined", () => {
			const state = resolveTeamSwitcherState([teamA], undefined);
			expect(state.currentTeam).toBeNull();
			expect(state.otherTeams).toEqual([]);
			expect(state.isMultiTeam).toBe(false);
		});

		it("returns empty state when activeTeamId matches no team in the list (stale context)", () => {
			const state = resolveTeamSwitcherState([teamA, teamB], "team-unknown");
			expect(state.currentTeam).toBeNull();
			expect(state.otherTeams).toEqual([]);
			expect(state.isMultiTeam).toBe(false);
		});
	});

	describe("single-team user", () => {
		it("sets currentTeam and leaves otherTeams empty for a single-membership user", () => {
			const state = resolveTeamSwitcherState([teamA], "team-a");
			expect(state.currentTeam).toEqual(teamA);
			expect(state.otherTeams).toEqual([]);
			expect(state.isMultiTeam).toBe(false);
		});

		it("preserves all team fields in currentTeam", () => {
			const richTeam: TeamEntry = {
				membershipId: "mem-rich",
				teamId: "team-rich",
				name: "Rich Corp",
				logoUrl: "https://example.com/logo.png",
				role: "owner",
			};
			const state = resolveTeamSwitcherState([richTeam], "team-rich");
			expect(state.currentTeam).toEqual(richTeam);
		});
	});

	describe("multi-team user", () => {
		it("splits teams into currentTeam and otherTeams for two memberships", () => {
			const state = resolveTeamSwitcherState([teamA, teamB], "team-a");
			expect(state.currentTeam).toEqual(teamA);
			expect(state.otherTeams).toEqual([teamB]);
			expect(state.isMultiTeam).toBe(true);
		});

		it("identifies the correct current team when active is not the first entry", () => {
			const state = resolveTeamSwitcherState([teamA, teamB, teamC], "team-b");
			expect(state.currentTeam).toEqual(teamB);
			expect(state.otherTeams).toHaveLength(2);
			expect(state.otherTeams.map((t) => t.teamId)).toEqual([
				"team-a",
				"team-c",
			]);
			expect(state.isMultiTeam).toBe(true);
		});

		it("handles three or more memberships correctly", () => {
			const state = resolveTeamSwitcherState([teamA, teamB, teamC], "team-a");
			expect(state.currentTeam).toEqual(teamA);
			expect(state.otherTeams).toHaveLength(2);
			expect(state.isMultiTeam).toBe(true);
		});

		it("exposes membershipId on all otherTeams entries (used by switchTeam mutation)", () => {
			const state = resolveTeamSwitcherState([teamA, teamB, teamC], "team-a");
			const ids = state.otherTeams.map((t) => t.membershipId);
			expect(ids).toContain("mem-b");
			expect(ids).toContain("mem-c");
		});
	});
});
