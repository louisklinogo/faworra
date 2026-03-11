import { redirect } from "next/navigation";

import OnboardingForm from "@/components/onboarding-form";
import { getServerViewer } from "@/lib/server-viewer";

export default async function OnboardingPage() {
	const viewer = await getServerViewer();

	if (!viewer.isAuthenticated) {
		redirect("/login?return_to=%2Fonboarding");
	}

	if (!viewer.needsOnboarding) {
		redirect("/dashboard");
	}

	return <OnboardingForm />;
}
