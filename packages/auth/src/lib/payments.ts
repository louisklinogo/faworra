import { env } from "@faworra-new/env/server";
import { Polar } from "@polar-sh/sdk";

// Billing/Polar is explicitly deferred for this mission.
// polarClient is null when POLAR_ACCESS_TOKEN is not configured so the API
// can boot and serve auth without requiring billing credentials.
export const polarClient = env.POLAR_ACCESS_TOKEN
	? new Polar({
			accessToken: env.POLAR_ACCESS_TOKEN,
			server: "sandbox",
		})
	: null;
