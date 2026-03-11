import "server-only";

import { env } from "@faworra-new/env/web";
import { polarClient } from "@polar-sh/better-auth";
import { createAuthClient } from "better-auth/react";

import { portlessAwareFetch } from "./portless-fetch.server";

export const serverAuthClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_SERVER_URL,
	plugins: [polarClient()],
	fetchOptions: {
		customFetchImpl: portlessAwareFetch,
	},
});
