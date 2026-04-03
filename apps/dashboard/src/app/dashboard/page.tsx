import { redirect } from "next/navigation";

import { getServerViewer } from "@/lib/server-viewer";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
	const viewer = await getServerViewer();

	if (!viewer.isAuthenticated) {
		redirect("/login?return_to=%2Fdashboard");
	}

	if (viewer.needsOnboarding || !viewer.activeTeam) {
		redirect("/onboarding");
	}

	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome {viewer.user?.name}</p>
			<Dashboard activeTeamName={viewer.activeTeam.name} />
		</div>
	);
}
