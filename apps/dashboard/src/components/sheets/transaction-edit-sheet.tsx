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
import {
	type EditableTransaction,
	TransactionEditForm,
} from "../forms/transaction-edit-form";

export function TransactionEditSheet() {
	const trpc = useTRPC();
	const { editTransaction, setParams } = useTransactionParams();
	const isOpen = Boolean(editTransaction);

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

	// Transform to EditableTransaction format
	const editableTransaction: EditableTransaction = {
		id: transaction.id,
		amount: transaction.amount,
		name: transaction.name,
		note: transaction.note,
		currency: transaction.currency,
		internal: transaction.internal ?? false,
		bankAccountId: transaction.bankAccountId,
		transactionDate: transaction.transactionDate,
		category: transaction.category
			? {
					id: transaction.category.id,
					name: transaction.category.name ?? "",
					color: transaction.category.color,
					slug: transaction.category.slug,
				}
			: null,
		assignedId: transaction.assignedId,
	};

	return (
		<Sheet onOpenChange={handleOpenChange} open={isOpen}>
			<SheetContent className="w-full rounded-none sm:max-w-[480px]">
				<SheetHeader className="mb-6">
					<SheetTitle>Edit Transaction</SheetTitle>
				</SheetHeader>

				<ScrollArea className="h-full p-0 pb-[100px]" hideScrollbar>
					<TransactionEditForm transaction={editableTransaction} />
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}
