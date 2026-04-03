import "server-only";

import { env } from "@faworra-new/env/web";
import { createAuthClient } from "better-auth/react";

import { portlessAwareFetch } from "./portless-fetch.server";

// Billing/Polar is explicitly deferred for this mission.
// The polarClient plugin is omitted so SSR auth calls do not require
// active Polar configuration.
export const serverAuthClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_SERVER_URL,
	fetchOptions: {
		customFetchImpl: portlessAwareFetch,
	},
});
