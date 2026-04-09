import type { AppRouter } from "@faworra-new/api/routers/index";
import { env } from "@faworra-new/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			toast.error(error.message, {
				action: {
					label: "retry",
					onClick: query.invalidate,
				},
			});
		},
	}),
});

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
