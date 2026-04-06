import { currencies } from "@faworra-new/api/currencies";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import OnboardingForm from "@/components/onboarding-form";
import { resolveOnboardingEntry } from "@/lib/onboarding-redirect";
import { createServerTrpcClient } from "@/lib/server-trpc";
import { getServerViewer } from "@/lib/server-viewer";

async function getDefaultCountryCode(): Promise<string> {
	const headersList = await headers();
	return headersList.get("cf-ipcountry") ?? "GH";
}

async function getDefaultCurrency(countryCode: string): Promise<string> {
	return (
		(currencies as Record<string, string | undefined>)[countryCode] ?? "GHS"
	);
}

export default async function OnboardingPage() {
	const viewer = await getServerViewer();

	if (!viewer.isAuthenticated) {
		redirect("/login?return_to=%2Fonboarding");
	}

	if (!viewer.needsOnboarding) {
		redirect("/dashboard");
	}

	// Before rendering the onboarding form, check whether the signed-in user
	// already has pending team invites.  If so, redirect to the invite-recovery
	// surface (/teams) so they can accept or decline before starting
	// default-team bootstrap.  This prevents a pending-invite user from
	// bypassing the recovery surface by navigating directly to /onboarding.
	const trpcClient = await createServerTrpcClient();
	const pendingInvites = await trpcClient.teamInvites.invitesByEmail.query();
	const inviteRecoveryRedirect = resolveOnboardingEntry(
		pendingInvites.length > 0
	);
	if (inviteRecoveryRedirect) {
		redirect(inviteRecoveryRedirect);
	}

	const countryCode = await getDefaultCountryCode();
	const currency = await getDefaultCurrency(countryCode);

	return (
		<OnboardingForm
			defaultCountryCode={countryCode}
			defaultCurrency={currency}
		/>
	);
}
