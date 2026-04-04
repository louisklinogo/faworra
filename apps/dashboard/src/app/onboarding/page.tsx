import { currencies } from "@faworra-new/api/currencies";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import OnboardingForm from "@/components/onboarding-form";
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

	const countryCode = await getDefaultCountryCode();
	const currency = await getDefaultCurrency(countryCode);

	return (
		<OnboardingForm
			defaultCountryCode={countryCode}
			defaultCurrency={currency}
		/>
	);
}
