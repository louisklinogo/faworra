"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Icons } from "@faworra-new/ui/components/icons";
import { useRouter } from "next/navigation";

export function NoResults() {
	const router = useRouter();

	return (
		<div className="flex h-[calc(100vh-300px)] items-center justify-center">
			<div className="flex flex-col items-center">
				<Icons.Transactions className="mb-4 h-12 w-12 text-muted-foreground" />
				<div className="mb-6 space-y-2 text-center">
					<h2 className="font-medium text-lg">No results</h2>
					<p className="text-[#606060] text-sm">
						Try another search, or adjusting the filters
					</p>
				</div>

				<Button onClick={() => router.push("/transactions")} variant="outline">
					Clear filters
				</Button>
			</div>
		</div>
	);
}

export function NoTransactions() {
	return (
		<div className="absolute top-0 left-0 z-20 flex h-[calc(100vh-300px)] w-full items-center justify-center">
			<div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
				<h2 className="mb-2 font-medium text-xl">No transactions</h2>
				<p className="mb-6 text-[#878787] text-sm">
					Connect your bank account to automatically import transactions and
					unlock powerful financial insights to help you make smarter money
					decisions.
				</p>

				<Button>Connect Bank</Button>
			</div>
		</div>
	);
}

export function ReviewComplete() {
	return (
		<div className="absolute top-0 left-0 z-20 flex h-[calc(100vh-300px)] w-full items-center justify-center">
			<div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
				<h2 className="mb-2 font-medium text-xl">All done</h2>
				<p className="text-[#878787] text-sm">
					Everything is exported. New transactions will appear here when they
					are ready to export.
				</p>
			</div>
		</div>
	);
}
