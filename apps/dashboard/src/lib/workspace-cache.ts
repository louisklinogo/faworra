/**
 * Pure helpers for applying workspace mutation results to TanStack Query caches.
 *
 * Both `user.switchTeam` and `teamInvites.accept` return a workspace patch
 * (activeTeam + membership + needsOnboarding) that should be applied to the
 * viewer and privateData caches atomically so the shell and dashboard body
 * see the new active workspace at the same time — preventing mismatch frames
 * between `router.refresh()` RSC re-renders and background query refetches.
 *
 * These helpers are pure functions (no side-effects) and work with any cache
 * entry that has the workspace fields, leveraging TypeScript structural typing.
 */

export interface WorkspacePatch {
	activeTeam: {
		id: string;
		name: string;
		logoUrl: string | null;
		settings: {
			baseCurrency: string | null;
			countryCode: string | null;
			fiscalYearStartMonth: number | null;
			industryKey: string | null;
			industryConfigVersion: string | null;
		} | null;
	} | null;
	membership: {
		role: string;
		teamId: string;
	} | null;
	needsOnboarding: boolean;
}

/**
 * Merges a workspace patch into an existing viewer cache entry.
 *
 * Returns `undefined` when `old` is `undefined` to avoid creating ghost cache
 * entries for queries that have never been fetched.  Pass this as the updater
 * function to `queryClient.setQueryData(trpc.viewer.queryKey(), ...)`.
 */
export function applyWorkspacePatchToViewer<
	T extends {
		activeTeam: unknown;
		membership: unknown;
		needsOnboarding: boolean;
	},
>(old: T | undefined, patch: WorkspacePatch): T | undefined {
	if (!old) {
		return undefined;
	}
	return {
		...old,
		activeTeam: patch.activeTeam,
		membership: patch.membership,
		needsOnboarding: patch.needsOnboarding,
	};
}

/**
 * Merges a workspace patch into an existing privateData cache entry.
 *
 * Returns `undefined` when `old` is `undefined`.  Returns `old` unchanged when
 * the patch carries no active workspace (privateData requires a team context so
 * replacing it with null would produce an inconsistent cache shape).  Pass this
 * as the updater function to `queryClient.setQueryData(trpc.privateData.queryKey(), ...)`.
 */
export function applyWorkspacePatchToPrivateData<
	T extends { activeTeam: unknown; membership: unknown },
>(old: T | undefined, patch: WorkspacePatch): T | undefined {
	if (!old) {
		return undefined;
	}
	if (!(patch.activeTeam && patch.membership)) {
		return old;
	}
	return {
		...old,
		activeTeam: patch.activeTeam,
		membership: patch.membership,
	};
}
