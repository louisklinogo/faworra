import { getServerViewer } from "@/lib/server-viewer";

import Dashboard from "./dashboard";

/**
 * Protected dashboard page.
 *
 * Auth and workspace gating are handled by the parent (app)/layout.tsx.
 * By the time this page renders, viewer.isAuthenticated is guaranteed to be
 * true and viewer.activeTeam is guaranteed to be non-null.
 */
export default async function DashboardPage() {
	// The viewer call here is deduplicated by Next.js server-component caching
	// within the same request.  The layout already made this call and redirected
	// if needed; this re-call is purely to read the resolved workspace name.
	const viewer = await getServerViewer();

	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome {viewer.user?.name}</p>
			{/* activeTeam is non-null here — layout guarantees it */}
			<Dashboard activeTeamName={viewer.activeTeam?.name ?? ""} />
		</div>
	);
}
