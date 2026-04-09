"use client";

const TRANSACTION_METHODS: Record<string, string> = {
	payment: "Payment",
	card_purchase: "Card Purchase",
	card_atm: "ATM",
	transfer: "Transfer",
	other: "Other",
	unknown: "Unknown",
	ach: "ACH",
	interest: "Interest",
	deposit: "Deposit",
	wire: "Wire",
	fee: "Fee",
	momo: "Mobile Money",
	cash: "Cash",
};

type Props = {
	method?: string | null;
};

export function TransactionMethod({ method }: Props) {
	if (!method) {
		return <span className="text-muted-foreground">-</span>;
	}

	return <span>{TRANSACTION_METHODS[method] ?? method}</span>;
}
