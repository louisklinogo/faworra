import type { AppRouter } from "@faworra-new/api/routers/index";
import { env } from "@faworra-new/env/web";
import { getLocationHeaders } from "@faworra-new/location";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";

import { portlessAwareFetch } from "./portless-fetch.server";

/**
 * Creates a server-side tRPC client that forwards the incoming request
 * cookies to the API so auth/session context is preserved across the
 * server-side call.
 *
 * Uses `cache: "no-store"` so each server render gets fresh data from the
 * API rather than a cached response.
 *
 * This is the shared helper for server-side tRPC calls; individual page
 * helpers such as `getServerViewer` build on top of this.
 */
export const createServerTrpcClient = () => {
	return createTRPCClient<AppRouter>({
		links: [
			httpBatchLink({
				url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
				async headers() {
					const requestHeaders = await headers();
					const cookie = requestHeaders.get("cookie");
					const location = getLocationHeaders(requestHeaders);

					return {
						...(cookie ? { cookie } : {}),
						"x-user-country": location.country,
						"x-user-locale": location.locale,
						"x-user-timezone": location.timezone,
					};
				},
				fetch(url, options) {
					return portlessAwareFetch(url, {
						...options,
						cache: "no-store",
					});
				},
			}),
		],
	});
};
