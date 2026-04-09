"use client";

import { TransactionCreateSheet } from "./transaction-create-sheet";
import { TransactionEditSheet } from "./transaction-edit-sheet";
import { TransactionSheet } from "./transaction-sheet";

export function GlobalSheets() {
	return (
		<>
			<TransactionSheet />
			<TransactionCreateSheet />
			<TransactionEditSheet />
		</>
	);
}
