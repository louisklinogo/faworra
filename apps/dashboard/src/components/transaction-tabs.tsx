"use client";

import { Tabs, TabsList, TabsTrigger } from "@faworra-new/ui/components/tabs";
import { cn } from "@faworra-new/ui/utils";
import { useEffect, useState } from "react";
import { useReviewTransactions } from "@/hooks/use-review-transactions";
import { useTransactionTab } from "@/hooks/use-transaction-tab";

function ReviewCount() {
	const { transactionIds } = useReviewTransactions();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || transactionIds.length === 0) {
		return null;
	}

	return (
		<span className="ml-1 text-[#878787] text-xs">
			({transactionIds.length})
		</span>
	);
}

export function TransactionTabs() {
	const { tab, setTab } = useTransactionTab();

	const handleValueChange = (value: string) => {
		if (value === "all" || value === "review") {
			setTab(value);
		}
	};

	return (
		<Tabs onValueChange={handleValueChange} value={tab}>
			<div className="relative flex w-fit items-stretch bg-[#f7f7f7] dark:bg-[#131313]">
				<TabsList className="flex h-auto items-stretch bg-transparent p-0">
					<TabsTrigger
						className={cn(
							"group relative flex h-[34px] min-h-[34px] items-center gap-1.5 whitespace-nowrap border border-transparent px-3 py-1.5 text-[14px] transition-all",
							"relative z-[1] mb-0 bg-[#f7f7f7] text-[#707070] hover:text-black dark:bg-[#131313] dark:text-[#666666] dark:hover:text-white",
							"data-[state=active]:z-10 data-[state=active]:mb-[-1px] data-[state=active]:bg-[#e6e6e6] data-[state=active]:text-black dark:data-[state=active]:bg-[#1d1d1d] dark:data-[state=active]:text-white"
						)}
						value="all"
					>
						All
					</TabsTrigger>
					<TabsTrigger
						className={cn(
							"group relative flex h-[34px] min-h-[34px] items-center gap-1.5 whitespace-nowrap border border-transparent px-3 py-1.5 text-[14px] transition-all",
							"relative z-[1] mb-0 bg-[#f7f7f7] text-[#707070] hover:text-black dark:bg-[#131313] dark:text-[#666666] dark:hover:text-white",
							"data-[state=active]:z-10 data-[state=active]:mb-[-1px] data-[state=active]:bg-[#e6e6e6] data-[state=active]:text-black dark:data-[state=active]:bg-[#1d1d1d] dark:data-[state=active]:text-white"
						)}
						value="review"
					>
						Review
						<ReviewCount />
					</TabsTrigger>
				</TabsList>
			</div>
		</Tabs>
	);
}
