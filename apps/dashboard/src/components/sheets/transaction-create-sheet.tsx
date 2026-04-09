"use client";

import { ScrollArea } from "@faworra-new/ui/components/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@faworra-new/ui/components/sheet";
import { useQuery } from "@tanstack/react-query";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTRPC } from "@/trpc/client";
import { TransactionCreateForm } from "../forms/transaction-create-form";

export function TransactionCreateSheet() {
	const trpc = useTRPC();
	const { createTransaction, setParams } = useTransactionParams();
	const isOpen = Boolean(createTransaction);
	const { data: viewer } = useQuery(trpc.viewer.queryOptions());

	const defaultCurrency = viewer?.activeTeam?.settings?.baseCurrency ?? "GHS";

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setParams({ createTransaction: null });
		}
	};

	return (
		<Sheet onOpenChange={handleOpenChange} open={isOpen}>
			<SheetContent className="w-full rounded-none sm:max-w-[480px]">
				<SheetHeader className="mb-6">
					<SheetTitle>Create Transaction</SheetTitle>
				</SheetHeader>

				<ScrollArea className="h-full p-0 pb-[100px]" hideScrollbar>
					<TransactionCreateForm
						defaultCurrency={defaultCurrency}
						onOpenChange={handleOpenChange}
					/>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}
