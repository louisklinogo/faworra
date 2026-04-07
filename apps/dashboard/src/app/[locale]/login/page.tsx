import { redirect } from "next/navigation";

import AuthScreen from "@/components/auth-screen";
import { getSafeReturnTo } from "@/lib/return-to";
import { getServerViewer } from "@/lib/server-viewer";

type NextRedirectTarget = Parameters<typeof redirect>[0];

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ return_to?: string }>;
}) {
	const viewer = await getServerViewer();
	const { return_to } = await searchParams;

	if (viewer.isAuthenticated) {
		if (viewer.needsOnboarding || !viewer.activeTeam) {
			redirect("/teams");
		}

		redirect(getSafeReturnTo(return_to) as unknown as NextRedirectTarget);
	}

	return <AuthScreen returnTo={return_to} />;
}
