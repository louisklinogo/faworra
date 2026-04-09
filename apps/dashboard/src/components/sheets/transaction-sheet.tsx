"use client";

import { Sheet, SheetContent } from "@faworra-new/ui/components/sheet";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { TransactionDetails } from "../transaction-details";

export function TransactionSheet() {
	const { transactionId, setParams } = useTransactionParams();
	const isOpen = Boolean(transactionId);

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setParams({ transactionId: null });
		}
	};

	return (
		<Sheet onOpenChange={handleOpenChange} open={isOpen}>
			<SheetContent>
				<TransactionDetails />
			</SheetContent>
		</Sheet>
	);
}
