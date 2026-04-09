import {
	defaultShouldDehydrateQuery,
	isServer,
	QueryCache,
	QueryClient,
} from "@tanstack/react-query";

function isUnauthorizedError(error: Error): boolean {
	if ("data" in error && typeof (error as any).data?.code === "string") {
		return (error as any).data.code === "UNAUTHORIZED";
	}
	return false;
}

export function makeQueryClient() {
	return new QueryClient({
		queryCache: isServer
			? undefined
			: new QueryCache({
					onError: (error) => {
						if (isUnauthorizedError(error)) {
							window.location.href = "/login";
						}
					},
				}),
		defaultOptions: {
			queries: {
				// 2-minute stale time — queries won't refetch if data is fresh
				staleTime: 2 * 60 * 1000,
				// Keep unused data in cache for 10 minutes
				gcTime: 10 * 60 * 1000,
				retry: isServer
					? false
					: (failureCount, error) => {
							if (isUnauthorizedError(error)) return false;
							return failureCount < 2;
						},
			},
			dehydrate: {
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === "pending",
			},
		},
	});
}
