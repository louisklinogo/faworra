import { getCurrency, getLocationHeaders } from "@faworra-new/location";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { OnboardingPage as OnboardingPageView } from "@/components/onboarding/onboarding-page";
import { resolveOnboardingEntry } from "@/lib/onboarding-redirect";
import { createServerTrpcClient } from "@/lib/server-trpc";
import { getServerViewer } from "@/lib/server-viewer";

export const metadata: Metadata = {
	title: "Onboarding | Faworra",
};

export default async function Onboarding() {
	const viewer = await getServerViewer();

	if (!viewer.isAuthenticated) {
		redirect("/login?return_to=%2Fonboarding");
	}

	if (!viewer.needsOnboarding) {
		redirect("/dashboard");
	}

	const trpcClient = await createServerTrpcClient();
	const pendingInvites = await trpcClient.teamInvites.invitesByEmail.query();
	const inviteRecoveryRedirect = resolveOnboardingEntry(
		pendingInvites.length > 0
	);
	if (inviteRecoveryRedirect) {
		redirect(inviteRecoveryRedirect);
	}

	const requestHeaders = await headers();
	const { country } = getLocationHeaders(requestHeaders);
	const currency = getCurrency(country) ?? "GHS";

	return (
		<OnboardingPageView
			defaultCountryCode={country}
			defaultCurrency={currency}
			hasOtherTeams={false}
		/>
	);
}
