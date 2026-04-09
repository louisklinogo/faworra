import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { prefetch, trpc, HydrateClient } from "@/trpc/server";
import { ErrorFallback } from "@/components/error-fallback";
import { CategoriesSkeleton } from "@/components/tables/categories/skeleton";
import { DataTable } from "@/components/tables/categories/table";

export const metadata: Metadata = {
	title: "Categories | Faworra",
};

export default async function CategoriesPage() {
	prefetch(trpc.transactions.categories.queryOptions());

	return (
		<div className="max-w-screen-lg">
			<HydrateClient>
				<ErrorBoundary errorComponent={ErrorFallback}>
					<Suspense fallback={<CategoriesSkeleton />}>
						<DataTable />
					</Suspense>
				</ErrorBoundary>
			</HydrateClient>
		</div>
	);
}
