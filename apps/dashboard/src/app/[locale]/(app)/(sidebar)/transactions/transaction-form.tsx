"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Input } from "@faworra-new/ui/components/input";
import { Label } from "@faworra-new/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

interface TransactionCategory {
	id: string;
	kind: "income" | "expense";
	name: string;
}

interface EditableTransaction {
	amount: number;
	categoryId: string | null;
	currency: string;
	description: string;
	id: string;
	kind: "income" | "expense";
	transactionDate: Date | string;
}

interface TransactionFormProps {
	categories: TransactionCategory[];
	defaultCurrency: string;
	isPending: boolean;
	onCancel?: () => void;
	onSubmit: (input: {
		amount: number;
		categoryId: string | null;
		currency: string;
		description: string;
		id?: string;
		kind: "income" | "expense";
		transactionDate: Date;
	}) => Promise<void>;
	transaction?: EditableTransaction | null;
}

const toDateInputValue = (value: Date | string | undefined) => {
	if (!value) {
		return new Date().toISOString().slice(0, 10);
	}

	return new Date(value).toISOString().slice(0, 10);
};

export default function TransactionForm({
	categories,
	defaultCurrency,
	isPending,
	onCancel,
	onSubmit,
	transaction,
}: TransactionFormProps) {
	const form = useForm({
		defaultValues: {
			amount: transaction ? String(transaction.amount) : "",
			categoryId: transaction?.categoryId ?? "",
			currency: transaction?.currency ?? defaultCurrency,
			description: transaction?.description ?? "",
			kind: transaction?.kind ?? "income",
			transactionDate: toDateInputValue(transaction?.transactionDate),
		},
		onSubmit: async ({ value }) => {
			const trimmedDescription = value.description.trim();
			const trimmedCurrency = value.currency.trim().toUpperCase();
			const parsedAmount = Number.parseInt(value.amount, 10);

			if (trimmedDescription.length < 2) {
				toast.error("Description must be at least 2 characters long");
				return;
			}

			if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
				toast.error("Amount must be a positive whole number");
				return;
			}

			if (trimmedCurrency.length !== 3) {
				toast.error("Currency must be a 3-letter code");
				return;
			}

			await onSubmit({
				amount: parsedAmount,
				categoryId: value.categoryId || null,
				currency: trimmedCurrency,
				description: trimmedDescription,
				id: transaction?.id,
				kind: value.kind,
				transactionDate: new Date(value.transactionDate),
			});
		},
	});

	useEffect(() => {
		form.reset({
			amount: transaction ? String(transaction.amount) : "",
			categoryId: transaction?.categoryId ?? "",
			currency: transaction?.currency ?? defaultCurrency,
			description: transaction?.description ?? "",
			kind: transaction?.kind ?? "income",
			transactionDate: toDateInputValue(transaction?.transactionDate),
		});
	}, [defaultCurrency, form, transaction]);

	const categoriesByKind = useMemo(() => {
		return {
			expense: categories.filter((category) => category.kind === "expense"),
			income: categories.filter((category) => category.kind === "income"),
		};
	}, [categories]);

	return (
		<div className="space-y-4 border-border border-b px-4 py-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-sm">
						{transaction ? "Edit transaction" : "New transaction"}
					</h3>
					<p className="mt-1 text-muted-foreground text-sm">
						Capture a real transaction for the active workspace.
					</p>
				</div>

				{transaction && onCancel ? (
					<Button onClick={onCancel} size="sm" variant="outline">
						Cancel edit
					</Button>
				) : null}
			</div>

			<form
				className="grid gap-4 md:grid-cols-2"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
			>
				<form.Field name="description">
					{(field) => (
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor={field.name}>Description</Label>
							<Input
								id={field.name}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder="Inventory purchase"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="kind">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Kind</Label>
							<select
								className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm"
								id={field.name}
								onBlur={field.handleBlur}
								onChange={(event) => {
									const nextKind = event.target.value as "income" | "expense";
									field.handleChange(nextKind);
									const allowedCategoryIds = new Set(
										categoriesByKind[nextKind].map((category) => category.id)
									);
									if (!allowedCategoryIds.has(form.state.values.categoryId)) {
										form.setFieldValue("categoryId", "");
									}
								}}
								value={field.state.value}
							>
								<option value="income">Income</option>
								<option value="expense">Expense</option>
							</select>
						</div>
					)}
				</form.Field>

				<form.Field name="categoryId">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Category</Label>
							<select
								className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm"
								id={field.name}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								value={field.state.value}
							>
								<option value="">Uncategorized</option>
								{categoriesByKind[form.state.values.kind].map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
						</div>
					)}
				</form.Field>

				<form.Field name="amount">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Amount</Label>
							<Input
								id={field.name}
								inputMode="numeric"
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder="125000"
								type="number"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="currency">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Currency</Label>
							<Input
								id={field.name}
								maxLength={3}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder="GHS"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="transactionDate">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Date</Label>
							<Input
								id={field.name}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								type="date"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				<form.Subscribe
					selector={(state) => ({
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ isSubmitting }) => (
						<div className="flex items-end md:col-span-2">
							<Button disabled={isPending || isSubmitting} type="submit">
								{transaction ? "Save transaction" : "Create transaction"}
							</Button>
						</div>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
