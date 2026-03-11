import { redirect } from "next/navigation";

import AuthScreen from "@/components/auth-screen";
import { getServerViewer } from "@/lib/server-viewer";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ return_to?: string }>;
}) {
	const viewer = await getServerViewer();

	if (viewer.isAuthenticated) {
		redirect(viewer.needsOnboarding ? "/onboarding" : "/dashboard");
	}

	const { return_to } = await searchParams;

	return <AuthScreen returnTo={return_to} />;
}
