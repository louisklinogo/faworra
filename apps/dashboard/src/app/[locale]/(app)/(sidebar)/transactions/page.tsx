import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { AddTransactions } from "@/components/add-transactions";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { DataTable } from "@/components/tables/transactions/data-table";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionTabs } from "@/components/transaction-tabs";
import { TransactionsColumnVisibility } from "@/components/transactions-column-visibility";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { loadSortParams } from "@/hooks/use-sort-params";
import { loadTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { loadTransactionTab } from "@/hooks/use-transaction-tab";
import { batchPrefetch, HydrateClient, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/columns";

type Props = {
	searchParams: Promise<SearchParams>;
};

export default async function Transactions(props: Props) {
	const searchParams = await props.searchParams;

	const filter = loadTransactionFilterParams(searchParams);
	const { sort } = loadSortParams(searchParams);
	const { tab } = loadTransactionTab(searchParams);

	// Get unified table settings from cookie
	const initialSettings = await getInitialTableSettings("transactions");

	// Build query filters for both tabs
	const hasFilters = Object.values(filter).some((value) => value !== null);

	// Map filter params to API schema for server prefetch
	const allTabFilter = {
		q: filter.q ?? null,
		accounts: filter.accounts ?? null,
		assignees: filter.assignees ?? null,
		attachments: filter.attachments ?? null,
		categories: filter.categories ?? null,
		start: filter.start ?? null,
		end: filter.end ?? null,
		type: filter.type ?? null,
		amountRange: filter.amount_range ?? null,
		recurring: filter.recurring ?? null,
		statuses: filter.statuses ?? null,
		manual: filter.manual ?? null,
		sort,
		// Keep server prefetch query key aligned with client query key.
		pageSize: hasFilters ? 10000 : undefined,
	};

	const reviewTabFilter = {
		// Review is a strict queue and does not apply user filters.
		// Midday pattern: fulfilled=true (has attachments OR status=completed), exported=false
		fulfilled: true,
		exported: false,
		sort,
		pageSize: 10000,
	};

	// Prefetch all data needed for instant experience
	batchPrefetch([
		// Transaction data for both tabs
		trpc.transactions.list.infiniteQueryOptions(allTabFilter, {
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		}),
		trpc.transactions.list.infiniteQueryOptions(reviewTabFilter, {
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		}),
		// Review count for tab badge
		trpc.transactions.reviewCount.queryOptions(),
		// Shared data used by table rows (assign user, tags)
		trpc.team.members.queryOptions(),
		trpc.tags.get.queryOptions(),
	]);

	return (
		<HydrateClient>
			<ScrollableContent>
				<div className="flex justify-between items-center py-6">
					<TransactionsSearchFilter />
					<div className="flex items-center gap-4">
						<div className="hidden md:flex items-center gap-2">
							<TransactionsColumnVisibility />
							<AddTransactions />
						</div>
						<TransactionTabs />
					</div>
				</div>

				<ErrorBoundary errorComponent={ErrorFallback}>
					<Suspense
						fallback={
							<Loading
								columnVisibility={initialSettings.columns}
								columnSizing={initialSettings.sizing}
								columnOrder={initialSettings.order}
							/>
						}
					>
						<DataTable initialSettings={initialSettings} initialTab={tab} />
					</Suspense>
				</ErrorBoundary>
			</ScrollableContent>
		</HydrateClient>
	);
}
