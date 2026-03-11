"use client";
import { Button } from "@faworra-new/ui/components/button";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export default function Dashboard({
	activeTeamName,
	customerState,
}: {
	activeTeamName: string;
	customerState: ReturnType<typeof authClient.customer.state>;
}) {
	const privateData = useQuery(trpc.privateData.queryOptions());

	const hasProSubscription =
		(customerState?.activeSubscriptions?.length ?? 0) > 0;

	return (
		<>
			<p>Workspace: {privateData.data?.activeTeam.name ?? activeTeamName}</p>
			<p>API: {privateData.data?.message}</p>
			<p>Plan: {hasProSubscription ? "Pro" : "Free"}</p>
			{hasProSubscription ? (
				<Button onClick={async () => await authClient.customer.portal()}>
					Manage Subscription
				</Button>
			) : (
				<Button
					onClick={async () => await authClient.checkout({ slug: "pro" })}
				>
					Upgrade to Pro
				</Button>
			)}
		</>
	);
}
