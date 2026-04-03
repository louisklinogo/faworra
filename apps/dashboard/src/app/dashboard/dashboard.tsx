"use client";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

// Billing/Polar is explicitly deferred for this mission.
// Customer state and subscription UI will be added in a follow-up billing mission.
export default function Dashboard({
	activeTeamName,
}: {
	activeTeamName: string;
}) {
	const privateData = useQuery(trpc.privateData.queryOptions());

	return (
		<>
			<p>Workspace: {privateData.data?.activeTeam.name ?? activeTeamName}</p>
			<p>API: {privateData.data?.message}</p>
		</>
	);
}
