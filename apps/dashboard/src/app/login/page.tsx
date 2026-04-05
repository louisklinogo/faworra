import { redirect } from "next/navigation";

import AuthScreen from "@/components/auth-screen";
import { getSafeReturnTo } from "@/lib/return-to";
import { getServerViewer } from "@/lib/server-viewer";

// Next.js typed-routes infers the redirect target from static literals.
// For dynamic in-app paths validated by getSafeReturnTo we need a targeted
// cast – the alternative of using `any` is intentionally avoided here.
type NextRedirectTarget = Parameters<typeof redirect>[0];

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ return_to?: string }>;
}) {
	const viewer = await getServerViewer();
	const { return_to } = await searchParams;

	if (viewer.isAuthenticated) {
		// Authenticated users without a usable workspace go to the recovery
		// surface (/teams) rather than directly to /onboarding.  The teams page
		// handles the final split: pending invites → invite-recovery UI; no
		// invites either → /onboarding.
		if (viewer.needsOnboarding || !viewer.activeTeam) {
			redirect("/teams");
		}

		// getSafeReturnTo guarantees this is a safe in-app path (starts with /,
		// not protocol-relative).  Typed-routes cannot express a dynamic path as
		// a static literal, so we use a scoped cast rather than `any`.
		redirect(getSafeReturnTo(return_to) as unknown as NextRedirectTarget);
	}

	return <AuthScreen returnTo={return_to} />;
}
