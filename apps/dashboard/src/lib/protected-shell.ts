import { getSafeReturnTo } from "./return-to";

/**
 * Minimal viewer shape needed to decide the protected-shell redirect.
 * This is intentionally decoupled from the full viewer type so the decision
 * logic can be unit-tested without any server/network machinery.
 */
export interface ShellViewerState {
	activeTeam: { id: string; name: string } | null;
	isAuthenticated: boolean;
	needsOnboarding: boolean;
}

/**
 * The set of redirect destinations the protected shell may produce.
 *
 * Using precise template-literal and literal types (rather than plain
 * `string`) lets Next.js typed-routes verify these destinations are valid
 * in-app routes without requiring a type assertion at the call site.
 *
 * Teamless authenticated users are sent to `/teams` — the Midday-shaped
 * recovery surface — rather than directly to `/onboarding`.  The teams page
 * then redirects to `/onboarding` if the user has no pending invites either.
 * This keeps invite-recovery and default-team-bootstrap as separate concerns.
 */
export type ShellRedirect = `/login?return_to=${string}` | "/teams" | null;

/**
 * Pure function that maps a viewer state + current path to the redirect
 * target for the Midday-shaped protected app shell.
 *
 * Returns `null` when no redirect is needed (user is authenticated and has
 * a usable workspace).  Returns a `/login?return_to=…` URL for
 * unauthenticated visitors, and `/onboarding` for authenticated users who
 * have not yet completed workspace setup.
 *
 * The `currentPath` parameter is used to build a safe `return_to` value so
 * the user can resume the intended destination after signing in.
 */
export const resolveShellRedirect = (
	viewer: ShellViewerState,
	currentPath: string
): ShellRedirect => {
	if (!viewer.isAuthenticated) {
		const safeReturnTo = getSafeReturnTo(currentPath);
		return `/login?return_to=${encodeURIComponent(safeReturnTo)}`;
	}

	if (viewer.needsOnboarding || !viewer.activeTeam) {
		// Route teamless users to the recovery surface (/teams) rather than
		// directly to /onboarding.  The teams page handles the final split:
		// users with pending invites see the invite-recovery UI; users with
		// neither an accepted workspace nor a pending invite are redirected to
		// /onboarding from there.
		return "/teams";
	}

	return null;
};
