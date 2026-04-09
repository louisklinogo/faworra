"use client";

import { ScrollArea } from "@faworra-new/ui/components/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@faworra-new/ui/components/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTRPC } from "@/trpc/client";
import { TransactionEditForm } from "../forms/transaction-edit-form";

export function TransactionEditSheet() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { editTransaction, setParams } = useTransactionParams();
	const isOpen = Boolean(editTransaction);

	const { data: viewer } = useQuery(trpc.viewer.queryOptions());
	const defaultCurrency = viewer?.activeTeam?.settings?.baseCurrency ?? "GHS";

	const { data: transaction } = useQuery({
		...trpc.transactions.getById.queryOptions({ id: editTransaction! }),
		enabled: isOpen && Boolean(editTransaction),
	});

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setParams({ editTransaction: null });
		}
	};

	if (!transaction?.manual) {
		return null;
	}

	return (
		<Sheet open={isOpen} onOpenChange={handleOpenChange}>
			<SheetContent className="w-full rounded-none sm:max-w-[480px]">
				<SheetHeader className="mb-6">
					<SheetTitle>Edit Transaction</SheetTitle>
				</SheetHeader>

				<ScrollArea className="h-full p-0 pb-[100px]" hideScrollbar>
					<TransactionEditForm
						defaultCurrency={defaultCurrency}
						onOpenChange={handleOpenChange}
						transaction={transaction}
					/>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}
