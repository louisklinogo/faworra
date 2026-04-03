import { env } from "@faworra-new/env/web";
import { createAuthClient } from "better-auth/react";

// Billing/Polar is explicitly deferred for this mission.
// The polarClient plugin is omitted so dashboard boot does not require
// active Polar configuration.
export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_SERVER_URL,
});
