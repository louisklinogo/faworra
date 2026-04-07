import { Badge } from "@faworra-new/ui/components/badge";

import { getServerViewer } from "@/lib/server-viewer";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
	const viewer = await getServerViewer();

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<Badge variant="outline">Workspace overview</Badge>
				<div>
					<h1 className="font-semibold text-3xl tracking-tight">Dashboard</h1>
					<p className="mt-2 text-muted-foreground text-sm">
						Welcome {viewer.user?.name}. Your active workspace is{" "}
						{viewer.activeTeam?.name ?? "still loading"}.
					</p>
				</div>
			</div>

			<Dashboard activeTeamName={viewer.activeTeam?.name ?? ""} />
		</div>
	);
}
