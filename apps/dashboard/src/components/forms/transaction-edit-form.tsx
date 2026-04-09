"use client";

import {
	type EditableTransaction,
	TransactionCreateForm,
} from "./transaction-create-form";

interface TransactionEditFormProps {
	defaultCurrency: string;
	onOpenChange: (open: boolean) => void;
	transaction: EditableTransaction | null;
}

export const TransactionEditForm = ({
	defaultCurrency,
	onOpenChange,
	transaction,
}: TransactionEditFormProps) => {
	return (
		<TransactionCreateForm
			defaultCurrency={defaultCurrency}
			onOpenChange={onOpenChange}
			transaction={transaction}
		/>
	);
};
