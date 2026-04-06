/**
 * Resolves the redirect target when an authenticated, teamless user opens
 * the onboarding route directly.
 *
 * Midday-aligned rule:
 * - If the user has at least one pending invite, redirect to `/teams` so they
 *   can accept/decline before starting default-team bootstrap.
 * - If the user has no pending invites, return `null` (onboarding should
 *   proceed normally).
 *
 * This pure function is decoupled from tRPC so it can be unit-tested without
 * server/network machinery.
 */
export const resolveOnboardingEntry = (
	hasPendingInvites: boolean
): "/teams" | null => {
	if (hasPendingInvites) {
		// Route the user to the invite-recovery surface. The `/teams` page
		// already handles the display of pending invites and the accept/decline
		// flow; `/onboarding` should not be reachable when invites are pending.
		return "/teams";
	}

	// No pending invites — the user genuinely needs default-team bootstrap.
	return null;
};
