import type { AppRouter } from "@faworra-new/api/routers/index";
import { env } from "@faworra-new/env/web";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";
import { portlessAwareFetch } from "./portless-fetch.server";

export const getServerViewer = async () => {
	const requestHeaders = await headers();
	const cookie = requestHeaders.get("cookie");
	const trpcClient = createTRPCClient<AppRouter>({
		links: [
			httpBatchLink({
				url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
				headers: () => (cookie ? { cookie } : {}),
				fetch(url, options) {
					return portlessAwareFetch(url, {
						...options,
						cache: "no-store",
					});
				},
			}),
		],
	});

	return trpcClient.viewer.query();
};
