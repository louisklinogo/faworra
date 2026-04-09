"use client";

import { useTransactionParams } from "@/hooks/use-transaction-params";
import { TransactionDetailDrawer } from "../tables/transactions/transaction-detail-drawer";

export function TransactionSheet() {
	const { transactionId, setParams } = useTransactionParams();
	const isOpen = Boolean(transactionId);

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setParams({ transactionId: null });
		}
	};

	return (
		<TransactionDetailDrawer
			onClose={() => handleOpenChange(false)}
			open={isOpen}
			transactionId={transactionId ?? null}
		/>
	);
}
