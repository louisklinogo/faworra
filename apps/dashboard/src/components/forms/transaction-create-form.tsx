"use client";

import { Button } from "@faworra-new/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@faworra-new/ui/components/form";
import { Input } from "@faworra-new/ui/components/input";
import { Label } from "@faworra-new/ui/components/label";
import { Switch } from "@faworra-new/ui/components/switch";
import { Textarea } from "@faworra-new/ui/components/textarea";
import { cn } from "@faworra-new/ui/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
	amount: z
		.number()
		.positive({ message: "Amount must be greater than 0" })
		.optional(),
	bankAccountId: z.string().optional(),
	counterpartyName: z.string().trim().max(100).optional(),
	currency: z.string().min(1).max(3),
	description: z
		.string()
		.trim()
		.max(500)
		.optional(),
	internal: z.boolean().default(false),
	// Note: 'kind' removed - income/expense determined by amount sign
	// For forms, user selects type and we set amount sign accordingly
	type: z.enum(["income", "expense"]),
	method: z.enum(["payment", "card_purchase", "card_atm", "transfer", "other", "unknown", "ach", "interest", "deposit", "wire", "fee", "momo", "cash"]).optional(),
	name: z.string().trim().min(1).max(200).optional(),
	note: z.string().optional(),
	taxAmount: z.number().optional(),
	taxRate: z.number().optional(),
	taxType: z.string().trim().max(20).optional(),
	transactionDate: z.string().min(1, "Date is required"),
});

type FormValues = z.infer<typeof formSchema>;

export interface EditableTransaction {
	amount: number;
	bankAccountId: string | null;
	counterpartyName: string | null;
	currency: string;
	description: string | null;
	id: string;
	internal: boolean;
	internalId: string;
	// Note: 'kind' removed - income/expense determined by amount sign
	method?: string;
	name: string;
	note: string | null;
	status: "excluded" | "pending" | "posted" | "completed" | "archived" | "exported";
	taxAmount?: number | null;
	taxRate?: number | null;
	taxType?: string | null;
	transactionDate: Date | string;
}

interface TransactionCreateFormProps {
	defaultCurrency: string;
	onOpenChange: (open: boolean) => void;
	transaction?: EditableTransaction | null;
}

const toIsoDate = (value: Date | string | undefined) => {
	if (!value) {
		return new Date().toISOString().slice(0, 10);
	}

	return new Date(value).toISOString().slice(0, 10);
};

const toFormAmount = (amount: number | undefined) => {
	if (amount === undefined) {
		return undefined;
	}

	return Math.abs(amount) / 100;
};

export function TransactionCreateForm({
	defaultCurrency,
	onOpenChange,
	transaction,
}: TransactionCreateFormProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: categories = [] } = useQuery(
		trpc.transactions.categories.queryOptions()
	);
	const { data: bankAccounts = [] } = useQuery(
		trpc.bankAccounts.list.queryOptions()
	);

	const defaultValues = useMemo<FormValues>(
		() => ({
			amount: toFormAmount(transaction?.amount),
			bankAccountId: transaction?.bankAccountId ?? undefined,
			counterpartyName: transaction?.counterpartyName ?? undefined,
			currency: transaction?.currency ?? defaultCurrency,
			description: transaction?.description ?? "",
			internal: transaction?.internal ?? false,
			// Der type from amount sign (Midday pattern)
			type: transaction?.amount && transaction.amount < 0 ? "expense" : "income",
			method: (transaction?.method ?? "other") as "payment" | "card_purchase" | "card_atm" | "transfer" | "other" | "unknown" | "ach" | "interest" | "deposit" | "wire" | "fee" | "momo" | "cash" | undefined,
			name: transaction?.name ?? undefined,
			note: transaction?.note ?? "",
			taxAmount: transaction?.taxAmount ? transaction.taxAmount / 100 : undefined,
			taxRate: transaction?.taxRate ?? undefined,
			taxType: transaction?.taxType ?? undefined,
			transactionDate: toIsoDate(transaction?.transactionDate),
		}),
		[defaultCurrency, transaction]
	);

	const form = useForm<FormValues>({
		defaultValues,
		resolver: zodResolver(formSchema),
	});

	useEffect(() => {
		form.reset(defaultValues);
	}, [defaultValues, form]);

	const invalidateTransactionQueries = async () => {
		await queryClient.invalidateQueries();
	};

	const createMutation = useMutation(
		trpc.transactions.create.mutationOptions({
			onError: (error) => {
				toast.error(error.message || "Failed to create transaction");
			},
			onSuccess: async () => {
				toast.success("Transaction created");
				await invalidateTransactionQueries();
				onOpenChange(false);
				form.reset(defaultValues);
			},
		})
	);

	const updateMutation = useMutation(
		trpc.transactions.update.mutationOptions({
			onError: (error) => {
				toast.error(error.message || "Failed to update transaction");
			},
			onSuccess: async () => {
				toast.success("Transaction updated");
				await invalidateTransactionQueries();
				onOpenChange(false);
			},
		})
	);

	const type = form.watch("type");
	// Note: categories no longer have 'kind' field - all categories are universal
	// User selects type, and amount sign determines income/expense
	const isPending = createMutation.isPending || updateMutation.isPending;

	let submitLabel = "Create Transaction";
	if (transaction) {
		submitLabel = "Save Transaction";
	}
	if (isPending) {
		submitLabel = transaction ? "Saving..." : "Creating...";
	}

	const handleSubmit = (values: FormValues) => {
		if (values.amount === undefined) {
			toast.error("Amount must be greater than 0");
			return;
		}

		// Apply amount sign based on type (Midday pattern)
		// expense = negative, income = positive
		const normalizedAmount =
			values.type === "expense"
				? -Math.abs(values.amount)
				: Math.abs(values.amount);

		// Generate a unique internal ID for manual transactions
		const internalId = transaction?.internalId ?? `manual-${crypto.randomUUID()}`;

		const payload = {
			amount: Math.round(normalizedAmount * 100),
			bankAccountId: values.bankAccountId || null,
			counterpartyName: values.counterpartyName || null,
			currency: values.currency.toUpperCase(),
			description: values.description || null,
			internal: values.internal,
			internalId,
			// Note: 'kind' field removed - income/expense determined by amount sign
			method: (values.method ?? "other") as "payment" | "card_purchase" | "card_atm" | "transfer" | "other" | "unknown" | "ach" | "interest" | "deposit" | "wire" | "fee" | "momo" | "cash",
			name: values.name || values.description || "Manual transaction",
			note: values.note || null,
			taxAmount: values.taxAmount ? Math.round(values.taxAmount * 100) : null,
			taxRate: values.taxRate || null,
			taxType: values.taxType || null,
			transactionDate: new Date(values.transactionDate),
		};

		if (transaction) {
			updateMutation.mutate({
				...payload,
				id: transaction.id,
			});
			return;
		}

		createMutation.mutate(payload);
	};

	return (
		<Form {...form}>
			<form
				className="space-y-6"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
						<div className="flex w-full border border-border bg-muted">
							{(["expense", "income"] as const).map((t) => (
								<Button
									className={cn(
										"h-8 flex-1 rounded-none border-border border-r px-3 text-xs capitalize last:border-r-0",
										type === t
											? "bg-background font-semibold"
											: "text-muted-foreground"
									)}
									key={t}
								onClick={() => {
									form.setValue("type", t);
								}}
								type="button"
								>
								{t}
								</Button>
							))}
						</div>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Input
											{...field}
											autoComplete="off"
											placeholder="e.g., Client payment, Office rent"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Amount</FormLabel>
										<FormControl>
											<Input
												{...field}
												min="0"
												onChange={(event) =>
													field.onChange(
														Number.parseFloat(event.target.value) || undefined
													)
												}
												placeholder="0.00"
												step="0.01"
												type="number"
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="currency"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Currency</FormLabel>
										<FormControl>
											<Input
												{...field}
												className="uppercase"
												maxLength={3}
												placeholder="GHS"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="transactionDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Date</FormLabel>
									<FormControl>
										<Input
											{...field}
											max={new Date().toISOString().slice(0, 10)}
											type="date"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{bankAccounts.length > 0 ? (
							<FormField
								control={form.control}
								name="bankAccountId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Account</FormLabel>
										<FormControl>
											<select
												className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm"
												onChange={(event) =>
													field.onChange(event.target.value || undefined)
												}
												value={field.value ?? ""}
											>
												<option value="">Unassigned manual transaction</option>
												{bankAccounts.map((account) => (
													<option key={account.id} value={account.id}>
														{account.name} ({account.currency})
													</option>
												))}
											</select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						) : null}

						<FormField
							control={form.control}
							name="note"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Note{" "}
										<span className="font-normal text-muted-foreground text-xs">
											(optional)
										</span>
									</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											className="min-h-[80px] resize-none rounded-none"
											placeholder="Any additional context..."
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="internal"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center justify-between">
										<div>
											<Label className="font-medium text-sm">
												Exclude from reports
											</Label>
											<p className="mt-0.5 text-muted-foreground text-xs">
												Use for internal transfers to avoid double-counting.
											</p>
										</div>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</div>
								</FormItem>
							)}
						/>

				<div className="flex items-center justify-end gap-2">
					<Button
						className="rounded-none"
						onClick={() => onOpenChange(false)}
						type="button"
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="rounded-none"
						disabled={isPending || !form.formState.isDirty}
						type="submit"
					>
						{submitLabel}
					</Button>
				</div>
			</form>
		</Form>
	);
}
