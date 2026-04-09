import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "@/utils/trpc";

/**
 * Hook to fetch the full review queue (transactions ready for export).
 * Review intentionally ignores user filters so the queue can reliably reach zero.
 *
 * Midday pattern: fulfilled=true (has attachments OR status=completed), exported=false
 */
export function useReviewTransactions() {
	const query = useInfiniteQuery(
		trpc.transactions.list.infiniteQueryOptions(
			{
				// Review is a strict queue and does not apply user filters.
				// Fulfilled = has attachments OR status=completed
				fulfilled: true,
				// Only show transactions not yet exported
				exported: false,
				pageSize: 10_000, // Load all for review
			},
			{
				getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
			}
		)
	);

	const transactionIds = useMemo(() => {
		return (
			query.data?.pages.flatMap((page) => page.items.map((tx) => tx.id)) ?? []
		);
	}, [query.data]);

	return {
		...query,
		transactionIds,
	};
}
