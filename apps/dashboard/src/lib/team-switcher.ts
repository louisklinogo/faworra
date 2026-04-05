/**
 * Pure helper for workspace-switcher state derivation.
 *
 * Extracted as a standalone module so the decision logic is unit-testable
 * without any browser, React, or tRPC machinery.
 *
 * Mirrors the data contract of `team.list` in `packages/api/src/routers/team.ts`.
 */

export interface TeamEntry {
	logoUrl: string | null;
	membershipId: string;
	name: string;
	role: string;
	teamId: string;
}

export interface TeamSwitcherState {
	/** The team that is currently active for this session. */
	currentTeam: TeamEntry | null;
	/**
	 * True when the user belongs to more than one accepted workspace.
	 * Used to decide whether to render the interactive dropdown or just the
	 * static current-workspace indicator (VAL-TENANCY-003).
	 */
	isMultiTeam: boolean;
	/**
	 * All other accepted memberships the user can switch into.
	 * Empty for single-team users.
	 */
	otherTeams: TeamEntry[];
}

/**
 * Derives the workspace-switcher display state from the full membership list
 * and the currently-active team id.
 *
 * Contract (mirrors VAL-TENANCY-003):
 * - No teams or no activeTeamId → all fields empty / false.
 * - Single-team: currentTeam set, otherTeams empty, isMultiTeam false.
 * - Multi-team: currentTeam set, otherTeams has ≥1 entry, isMultiTeam true.
 * - activeTeamId that matches no entry → currentTeam null, otherTeams empty,
 *   isMultiTeam false (treated as unresolved workspace context).
 */
export function resolveTeamSwitcherState(
	teams: TeamEntry[],
	activeTeamId: string | null | undefined
): TeamSwitcherState {
	if (teams.length === 0 || !activeTeamId) {
		return { currentTeam: null, otherTeams: [], isMultiTeam: false };
	}

	const currentTeam = teams.find((t) => t.teamId === activeTeamId) ?? null;

	if (!currentTeam) {
		// Active team id doesn't match any membership — stale context.
		return { currentTeam: null, otherTeams: [], isMultiTeam: false };
	}

	const otherTeams = teams.filter((t) => t.teamId !== activeTeamId);

	return {
		currentTeam,
		otherTeams,
		isMultiTeam: otherTeams.length > 0,
	};
}
