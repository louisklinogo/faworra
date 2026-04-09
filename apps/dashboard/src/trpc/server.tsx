import "server-only";

import type { AppRouter } from "@faworra-new/api/routers/index";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
	createTRPCOptionsProxy,
	type TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createServerTrpcClient } from "@/lib/server-trpc";
import { makeQueryClient } from "./query-client";

// Stable getter — returns the same QueryClient for the duration of the request
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: createServerTrpcClient(),
	queryClient: getQueryClient,
});

/**
 * prefetch — fire-and-forget a single query (Midday pattern)
 * Usage: prefetch(trpc.transactions.categories.queryOptions())
 */
// biome-ignore lint/suspicious/noExplicitAny: matching Midday's generic pattern
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
	queryOptions: T,
) {
	const queryClient = getQueryClient();

	if (queryOptions.queryKey?.[1]?.type === "infinite") {
		void queryClient.prefetchInfiniteQuery(queryOptions as never).catch(() => {
			// Avoid unhandled promise rejections from fire-and-forget prefetches.
		});
	} else {
		void queryClient.prefetchQuery(queryOptions).catch(() => {
			// Avoid unhandled promise rejections from fire-and-forget prefetches.
		});
	}
}

/**
 * HydrateClient — wrap pages with this to send prefetched data to the client.
 * Usage: <HydrateClient><ClientComponent /></HydrateClient>
 */
export function HydrateClient(props: { children: React.ReactNode }) {
	const queryClient = getQueryClient();
	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			{props.children}
		</HydrationBoundary>
	);
}

/**
 * batchPrefetch — fire-and-forget multiple queries at once.
 * Usage: batchPrefetch([trpc.transactions.list.queryOptions(), trpc.tags.get.queryOptions()])
 */
export function batchPrefetch(queryOptionsArray: unknown[]) {
	const queryClient = getQueryClient();

	for (const queryOptions of queryOptionsArray) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const opts = queryOptions as any;
		if (opts?.queryKey?.[1]?.type === "infinite") {
			void queryClient.prefetchInfiniteQuery(opts).catch(() => {
				// Avoid unhandled promise rejections from fire-and-forget prefetches.
			});
		} else {
			void queryClient.prefetchQuery(opts).catch(() => {
				// Avoid unhandled promise rejections from fire-and-forget prefetches.
			});
		}
	}
}
