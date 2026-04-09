"use client";

import { CategoryCreateSheet } from "./category-create-sheet";
import { CategoryEditSheet } from "./category-edit-sheet";
import { TransactionCreateSheet } from "./transaction-create-sheet";
import { TransactionEditSheet } from "./transaction-edit-sheet";
import { TransactionSheet } from "./transaction-sheet";

export function GlobalSheets() {
	return (
		<>
			<CategoryCreateSheet />
			<CategoryEditSheet />

			<TransactionSheet />
			<TransactionCreateSheet />
			<TransactionEditSheet />
		</>
	);
}
