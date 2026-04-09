"use client";

import { uniqueCurrencies } from "@faworra-new/location/currencies";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@faworra-new/ui/components/accordion";
import { Button } from "@faworra-new/ui/components/button";
import { CurrencyInput } from "@faworra-new/ui/components/currency-input";
import { Input } from "@faworra-new/ui/components/input";
import { Label } from "@faworra-new/ui/components/label";
import { Switch } from "@faworra-new/ui/components/switch";
import { Textarea } from "@faworra-new/ui/components/textarea";
import { cn } from "@faworra-new/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";

import { AssignUser } from "@/components/assign-user";
import { SelectAccount } from "@/components/select-account";
import { SelectCategory } from "@/components/select-category";
import { SelectCurrency } from "@/components/select-currency";
import { useTRPC } from "@/trpc/client";

export interface EditableTransaction {
	amount: number;
	assignedId?: string | null;
	bankAccountId: string | null;
	category?: {
		id: string;
		name: string;
		color: string | null;
		slug: string | null;
	} | null;
	currency: string;
	id: string;
	internal: boolean;
	name: string;
	note: string | null;
	transactionDate: Date | string;
}

type Props = {
	transaction: EditableTransaction;
};

export function TransactionEditForm({ transaction }: Props) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: accounts } = useQuery(trpc.bankAccounts.list.queryOptions());
	const { data: categories } = useQuery(
		trpc.transactions.categories.queryOptions()
	);

	const updateMutation = useMutation(
		trpc.transactions.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update transaction");
			},
		})
	);

	// Derive transaction type from amount sign
	const transactionAmount =
		typeof transaction.amount === "number"
			? transaction.amount
			: Number(transaction.amount) || 0;

	let transactionType: "income" | "expense";
	if (transactionAmount > 0) {
		transactionType = "income";
	} else if (transactionAmount < 0) {
		transactionType = "expense";
	} else {
		transactionType =
			transaction.category?.slug === "income" ? "income" : "expense";
	}

	// Local state for debounced inputs
	const [name, setName] = useState(transaction.name);
	const [amount, setAmount] = useState(Math.abs(transaction.amount));
	const [note, setNote] = useState(transaction.note ?? "");

	// Debounce text inputs
	const [debouncedName] = useDebounceValue(name, 500);
	const [debouncedAmount] = useDebounceValue(amount, 500);
	const [debouncedNote] = useDebounceValue(note, 500);

	// Sync local state with transaction prop when it changes
	useEffect(() => {
		setName(transaction.name);
		setAmount(Math.abs(transaction.amount));
		setNote(transaction.note ?? "");
	}, [transaction.id, transaction.name, transaction.amount, transaction.note]);

	// Update on debounced name change
	useEffect(() => {
		if (debouncedName !== transaction.name && debouncedName.trim()) {
			updateMutation.mutate({
				id: transaction.id,
				name: debouncedName,
			});
		}
	}, [debouncedName]);

	// Update on debounced amount change
	useEffect(() => {
		const finalAmount =
			transactionType === "expense"
				? -Math.abs(debouncedAmount)
				: Math.abs(debouncedAmount);

		const currentAmount = Number(transaction.amount);
		if (finalAmount !== currentAmount) {
			updateMutation.mutate({
				id: transaction.id,
				amount: finalAmount,
			});
		}
	}, [debouncedAmount, transactionType, transaction.amount, transaction.id]);

	// Update on debounced note change
	useEffect(() => {
		const noteValue = debouncedNote?.trim() || null;
		if (noteValue !== (transaction.note ?? null)) {
			updateMutation.mutate({
				id: transaction.id,
				note: noteValue,
			});
		}
	}, [debouncedNote]);

	// Memoize selected category from transaction
	const selectedCategory = useMemo(() => {
		if (transaction.category) {
			return {
				id: transaction.category.id,
				name: transaction.category.name,
				color: transaction.category.color ?? null,
				slug: transaction.category.slug ?? null,
			};
		}
		return undefined;
	}, [transaction.category]);

	return (
		<div className="space-y-8">
			<div>
				<div className="flex w-full border border-border bg-muted">
					<Button
						className={cn(
							"h-6 flex-1 rounded-none border-border border-r px-2 text-xs last:border-r-0",
							transactionType === "expense"
								? "bg-transparent"
								: "bg-background font-medium"
						)}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							// Update amount immediately (convert to negative)
							const finalAmount = -Math.abs(amount);
							updateMutation.mutate({
								id: transaction.id,
								amount: finalAmount,
							});
						}}
						type="button"
						variant="ghost"
					>
						Expense
					</Button>
					<Button
						className={cn(
							"h-6 flex-1 rounded-none border-border border-r px-2 text-xs last:border-r-0",
							transactionType === "income"
								? "bg-transparent"
								: "bg-background font-medium"
						)}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							// Update amount immediately
							const finalAmount = Math.abs(amount);
							updateMutation.mutate({
								id: transaction.id,
								amount: finalAmount,
							});
						}}
						type="button"
						variant="ghost"
					>
						Income
					</Button>
				</div>
				<p className="mt-2 text-[0.8rem] text-muted-foreground">
					Select whether this is money coming in (income) or going out (expense)
				</p>
			</div>

			<div>
				<Label className="mb-2 block" htmlFor="name">
					Description
				</Label>
				<Input
					autoCapitalize="none"
					autoComplete="off"
					autoCorrect="off"
					id="name"
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g., Office supplies, Invoice payment"
					spellCheck={false}
					value={name}
				/>
				<p className="mt-2 text-[0.8rem] text-muted-foreground">
					A brief description of what this transaction is for
				</p>
			</div>

			<div className="flex space-x-4">
				<div className="w-full">
					<Label className="mb-2 block" htmlFor="amount">
						Amount
					</Label>
					<CurrencyInput
						allowNegative={false}
						onValueChange={(values) => {
							if (values.floatValue !== undefined) {
								setAmount(Math.abs(values.floatValue));
							}
						}}
						placeholder="0.00"
						value={amount}
					/>
					<p className="mt-2 text-[0.8rem] text-muted-foreground">
						Enter the transaction amount
					</p>
				</div>

				<div className="w-full">
					<Label className="mb-2 block" htmlFor="currency">
						Currency
					</Label>
					<SelectCurrency
						className="w-full"
						currencies={uniqueCurrencies}
						onChange={(value) => {
							updateMutation.mutate({
								id: transaction.id,
								currency: value,
							});
						}}
						value={transaction.currency}
					/>
					<p className="mt-2 text-[0.8rem] text-muted-foreground">
						The currency for this transaction
					</p>
				</div>
			</div>

			<div className="flex space-x-4">
				<div className="w-full">
					<Label className="mb-2 block" htmlFor="account">
						Account
					</Label>
					<SelectAccount
						onChange={(value) => {
							updateMutation.mutate({
								id: transaction.id,
								bankAccountId: value.id,
							});
						}}
						placeholder="Select account"
						value={transaction.bankAccountId ?? accounts?.at(0)?.id ?? ""}
					/>
					<p className="mt-2 text-[0.8rem] text-muted-foreground">
						The account this transaction belongs to
					</p>
				</div>

				<div className="w-full">
					<Label className="mb-2 block" htmlFor="date">
						Date
					</Label>
					<Input
						id="date"
						onChange={(e) => {
							if (e.target.value) {
								updateMutation.mutate({
									id: transaction.id,
									transactionDate: e.target.value,
								});
							}
						}}
						type="date"
						value={
							transaction.transactionDate
								? formatISO(new Date(transaction.transactionDate), {
										representation: "date",
									})
								: ""
						}
					/>
					<p className="mt-2 text-[0.8rem] text-muted-foreground">
						When this transaction occurred
					</p>
				</div>
			</div>

			<div className="flex space-x-4">
				<div className="w-full">
					<Label className="mb-2 block" htmlFor="category">
						Category
					</Label>
					<SelectCategory
						onChange={(category) => {
							if (category) {
								updateMutation.mutate({
									id: transaction.id,
									categorySlug: category.slug,
								});
							}
						}}
						selected={selectedCategory}
					/>
					<p className="mt-2 text-[0.8rem] text-muted-foreground">
						Help organize and track your transactions
					</p>
				</div>

				<div className="w-full">
					<Label className="mb-2 block" htmlFor="assign">
						Assign
					</Label>
					<AssignUser
						onSelect={(user) => {
							updateMutation.mutate({
								id: transaction.id,
								assignedId: user?.id ?? null,
							});
						}}
						selectedId={transaction.assignedId ?? undefined}
					/>
					<p className="mt-2 text-[0.8rem] text-muted-foreground">
						Assign this transaction to a team member
					</p>
				</div>
			</div>

			<Accordion defaultValue={["attachment"]} type="multiple">
				<AccordionItem value="attachment">
					<AccordionTrigger>Attachment</AccordionTrigger>
					<AccordionContent>
						<div className="space-y-2">
							<p className="text-muted-foreground text-xs">
								Upload receipts, invoices, or other documents related to this
								transaction
							</p>
							<p className="text-muted-foreground text-xs">
								Attachment support coming soon
							</p>
						</div>
					</AccordionContent>
				</AccordionItem>

				<div className="mt-6 mb-4">
					<Label className="mb-2 block font-medium text-md" htmlFor="settings">
						Exclude from reports
					</Label>
					<div className="flex flex-row items-center justify-between">
						<div className="space-y-0.5 pr-4">
							<p className="text-muted-foreground text-xs">
								Exclude this transaction from reports like profit, expense and
								revenue. This is useful for internal transfers between accounts
								to avoid double-counting.
							</p>
						</div>

						<Switch
							checked={transaction.internal ?? false}
							onCheckedChange={(checked) => {
								updateMutation.mutate({
									id: transaction.id,
									internal: checked,
								});
							}}
						/>
					</div>
				</div>

				<AccordionItem value="note">
					<AccordionTrigger>Note</AccordionTrigger>
					<AccordionContent>
						<div className="space-y-2">
							<p className="text-muted-foreground text-xs">
								Add any additional details or context about this transaction
							</p>
							<Textarea
								className="min-h-[100px] resize-none"
								onChange={(e) => setNote(e.target.value)}
								placeholder="Note"
								value={note}
							/>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
