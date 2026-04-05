"use client";

import { Button } from "@faworra-new/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@faworra-new/ui/components/dropdown-menu";
import { Skeleton } from "@faworra-new/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { resolveTeamSwitcherState } from "@/lib/team-switcher";
import { trpc } from "@/utils/trpc";

/**
 * Workspace switcher dropdown — Midday team-dropdown shape adapted for Faworra.
 *
 * Uses `trpc.viewer` (public endpoint) for the active-team context and
 * `trpc.team.list` (protected endpoint, conditionally enabled) for the full
 * membership list.  `trpc.user.switchTeam` (membership-first invariant) drives
 * the switch mutation.
 *
 * Rendering contract (mirrors VAL-TENANCY-003):
 * - Not authenticated / no active team: renders nothing.
 * - Loading: renders a skeleton placeholder.
 * - Single-team: renders a non-interactive current-workspace indicator only.
 *   No dead-end alternate switch target is exposed.
 * - Multi-team: renders a DropdownMenu with the current workspace distinctly
 *   marked (✓) and all other accepted memberships as actionable switch targets.
 *
 * Post-switch behaviour (mirrors VAL-TENANCY-004 and VAL-CROSS-004):
 *   1. `queryClient.invalidateQueries()` — refreshes all TanStack Query
 *      client-side cache (viewer, team.list, privateData, etc.).
 *   2. `router.refresh()` — triggers Next.js RSC re-render so server
 *      components pick up the new active workspace from the API.
 */
export function TeamDropdown() {
	const router = useRouter();
	const queryClient = useQueryClient();

	// viewer is a public procedure — always safe to call regardless of auth state.
	// It returns isAuthenticated + activeTeam which is all we need here.
	const { data: viewer, isLoading: viewerLoading } = useQuery(
		trpc.viewer.queryOptions()
	);

	const isAuthenticated = viewer?.isAuthenticated === true;

	// Only fetch the membership list once we know the user is authenticated.
	// This avoids a FORBIDDEN tRPC error being surfaced via QueryCache.
	const { data: teams, isLoading: teamsLoading } = useQuery({
		...trpc.team.list.queryOptions(),
		enabled: isAuthenticated,
	});

	const switchTeamMutation = useMutation(
		trpc.user.switchTeam.mutationOptions({
			onSuccess: async () => {
				// 1. Refresh all client-side cached query data so the header, shell,
				//    and protected content all see the new active workspace.
				await queryClient.invalidateQueries();
				// 2. Re-render RSC components (protected shell layout re-calls
				//    getServerViewer, picking up the new activeMembershipId from the DB).
				router.refresh();
			},
		})
	);

	// Still resolving auth / viewer state
	if (viewerLoading) {
		return <Skeleton className="h-7 w-32" />;
	}

	// Guest or teamless recovery state — nothing to show in the switcher
	if (!(isAuthenticated && viewer?.activeTeam)) {
		return null;
	}

	// Still loading team membership list
	if (teamsLoading) {
		return <Skeleton className="h-7 w-32" />;
	}

	const switcherState = resolveTeamSwitcherState(
		teams ?? [],
		viewer.activeTeam.id
	);

	// Workspace context not resolved (e.g. stale pointer not yet corrected)
	if (!switcherState.currentTeam) {
		return null;
	}

	// ── Single-team affordance ───────────────────────────────────────────────
	// Per VAL-TENANCY-003: no actionable switch control beyond the current-
	// workspace indicator.  We render a plain text label that is not clickable
	// and presents no dead-end dropdown.
	if (!switcherState.isMultiTeam) {
		return (
			<span className="font-medium text-primary text-sm">
				{switcherState.currentTeam.name}
			</span>
		);
	}

	// ── Multi-team affordance ────────────────────────────────────────────────
	// Per VAL-TENANCY-003: current workspace distinctly marked, ≥1 actionable
	// alternate target.
	//
	// All items must be inside a DropdownMenuGroup because DropdownMenuLabel
	// maps to MenuPrimitive.GroupLabel which requires a MenuPrimitive.Group
	// ancestor (Base UI invariant).
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button size="sm" variant="ghost" />}>
				{switcherState.currentTeam.name}
				<ChevronsUpDownIcon className="opacity-50" />
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuGroup>
					<DropdownMenuLabel>Workspaces</DropdownMenuLabel>
					<DropdownMenuSeparator />

					{/* Current workspace — marked with a check to distinguish it */}
					<DropdownMenuItem>
						<CheckIcon />
						<span className="font-medium">
							{switcherState.currentTeam.name}
						</span>
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					{/* Alternate workspaces — each is an actionable switch target */}
					{switcherState.otherTeams.map((team) => (
						<DropdownMenuItem
							disabled={switchTeamMutation.isPending}
							key={team.membershipId}
							onClick={() => {
								switchTeamMutation.mutate({ membershipId: team.membershipId });
							}}
						>
							{/* Spacer aligns team names with the checked current-team label */}
							<span className="size-4 shrink-0" />
							{team.name}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
