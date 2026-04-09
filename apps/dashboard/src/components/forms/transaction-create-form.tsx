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
import { DatePicker } from "@faworra-new/ui/components/date-picker";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@faworra-new/ui/components/form";
import { Input } from "@faworra-new/ui/components/input";
import { Label } from "@faworra-new/ui/components/label";
import { Switch } from "@faworra-new/ui/components/switch";
import { Textarea } from "@faworra-new/ui/components/textarea";
import { SubmitButton } from "@faworra-new/ui/components/submit-button";
import { cn } from "@faworra-new/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AssignUser } from "@/components/assign-user";
import type { Attachment } from "@/components/attachment-item";
import { SelectAccount } from "@/components/select-account";
import { SelectCategory } from "@/components/select-category";
import { SelectCurrency } from "@/components/select-currency";
import { TransactionAttachments } from "@/components/transaction-attachments";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
	name: z.string().min(1, "Description is required"),
	amount: z.number().refine((val) => Math.abs(val) > 0, {
		message: "Amount must be greater than 0",
	}),
	currency: z.string(),
	transactionDate: z.string().min(1, "Date is required"),
	bankAccountId: z.string().optional(),
	assignedId: z.string().optional(),
	categorySlug: z.string().optional(),
	note: z.string().optional(),
	internal: z.boolean().optional(),
	transactionType: z.enum(["income", "expense"]),
	attachments: z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
				size: z.number(),
				type: z.string(),
			})
		)
		.optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionCreateFormProps {
	defaultCurrency: string;
	onOpenChange: (open: boolean) => void;
}

export function TransactionCreateForm({
	defaultCurrency,
	onOpenChange,
}: TransactionCreateFormProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [formAttachments, setFormAttachments] = useState<Attachment[]>([]);

	const { data: categories = [] } = useQuery(
		trpc.transactions.categories.queryOptions()
	);

	const { data: accounts } = useQuery(trpc.bankAccounts.list.queryOptions());

	const createMutation = useMutation(
		trpc.transactions.create.mutationOptions({
			onError: (error) => {
				toast.error(error.message || "Failed to create transaction");
			},
			onSuccess: async () => {
				toast.success("Transaction created");
				await queryClient.invalidateQueries();
				onOpenChange(false);
			},
		})
	);

	const form = useZodForm(formSchema, {
		defaultValues: {
			name: "",
			categorySlug: undefined,
			transactionDate: formatISO(new Date(), { representation: "date" }),
			bankAccountId: accounts?.at(0)?.id ?? undefined,
			assignedId: undefined,
			note: "",
			currency: defaultCurrency,
			attachments: undefined,
			internal: false,
			transactionType: "expense" as const,
		},
	});

	const transactionType = form.watch("transactionType");
	const isPending = createMutation.isPending;

	const handleCreate = (values: FormValues) => {
		// Apply amount sign based on transaction type (Midday pattern)
		const signedAmount =
			values.transactionType === "expense"
				? -Math.abs(values.amount)
				: Math.abs(values.amount);

		const internalId = `manual-${crypto.randomUUID()}`;

		createMutation.mutate({
			amount: Math.round(signedAmount * 100),
			bankAccountId: values.bankAccountId || null,
			counterpartyName: null,
			currency: values.currency.toUpperCase(),
			description: values.name || null,
			internal: values.internal ?? false,
			internalId,
			method: "other" as const,
			name: values.name || "Manual transaction",
			note: values.note || null,
			taxAmount: null,
			taxRate: null,
			taxType: null,
			transactionDate: new Date(values.transactionDate),
		});
	};

	return (
		<Form {...form}>
			<form
				className="space-y-8"
				onSubmit={form.handleSubmit((values) => {
					handleCreate(values);
				})}
			>
				<FormField
					control={form.control}
					name="transactionType"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<div className="flex w-full border border-border bg-muted">
									<Button
										className={cn(
											"h-6 flex-1 rounded-none border-border border-r px-2 text-xs last:border-r-0",
											field.value === "expense"
												? "bg-transparent"
												: "bg-background font-medium"
										)}
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											field.onChange("expense");
											// Clear income category if switching to expense
											if (form.getValues("categorySlug") === "income") {
												form.setValue("categorySlug", undefined);
											}
											// Update amount to negative if there's an amount
											const currentAmount = form.getValues("amount");
											if (currentAmount && currentAmount > 0) {
												form.setValue("amount", -Math.abs(currentAmount));
											}
										}}
										type="button"
										variant="ghost"
									>
										Expense
									</Button>
									<Button
										className={cn(
											"h-6 flex-1 rounded-none border-border border-r px-2 text-xs last:border-r-0",
											field.value === "income"
												? "bg-transparent"
												: "bg-background font-medium"
										)}
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											field.onChange("income");
											// Update amount to positive if there's an amount
											const currentAmount = form.getValues("amount");
											if (currentAmount) {
												const positiveAmount = Math.abs(currentAmount);
												form.setValue("amount", positiveAmount);
												// Auto-select income category if amount is positive
												if (positiveAmount > 0) {
													form.setValue("categorySlug", "income");
												}
											}
										}}
										type="button"
										variant="ghost"
									>
										Income
									</Button>
								</div>
							</FormControl>
							<FormDescription>
								Select whether this is money coming in (income) or going out
								(expense)
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Input
									{...field}
									autoCapitalize="none"
									autoComplete="off"
									autoCorrect="off"
									placeholder="e.g., Client payment, Office rent"
									spellCheck={false}
								/>
							</FormControl>
							<FormDescription>
								A brief description of what this transaction is for
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex space-x-4">
					<FormField
						control={form.control}
						name="amount"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Amount</FormLabel>
								<FormControl>
									<CurrencyInput
										allowNegative={false}
										onValueChange={(values) => {
											if (values.floatValue !== undefined) {
												const positiveValue = Math.abs(values.floatValue);
												const signedValue =
													transactionType === "expense"
														? -positiveValue
														: positiveValue;
												field.onChange(signedValue);
											}
										}}
										placeholder="0.00"
										value={field.value ? Math.abs(field.value) : undefined}
									/>
								</FormControl>
								<FormDescription>Enter the transaction amount</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="currency"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Currency</FormLabel>
								<FormControl>
									<SelectCurrency
										className="w-full"
										currencies={uniqueCurrencies}
										onChange={field.onChange}
										value={field.value}
									/>
								</FormControl>
								<FormDescription>
									The currency for this transaction
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex space-x-4">
					<FormField
						control={form.control}
						name="bankAccountId"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Account</FormLabel>
								<FormControl>
									<SelectAccount
										onChange={(value) => {
											field.onChange(value.id);
										}}
										placeholder="Select account"
										value={field.value}
									/>
								</FormControl>
								<FormDescription>
									The account this transaction belongs to
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="transactionDate"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Date</FormLabel>
								<FormControl>
									<DatePicker
										date={field.value ? new Date(field.value) : undefined}
										onSelect={(date) => {
											if (date) {
												field.onChange(
													formatISO(date, { representation: "date" })
												);
											}
										}}
										placeholder="Select date"
									/>
								</FormControl>
								<FormDescription>
									When this transaction occurred
								</FormDescription>
							</FormItem>
						)}
					/>
				</div>

				<div className="flex space-x-4">
					<FormField
						control={form.control}
						name="categorySlug"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Category</FormLabel>
								<FormControl>
									<SelectCategory
										onChange={(category) => {
											field.onChange(category?.slug);
										}}
										selected={categories
											?.map((cat) => {
												if (!cat) {
													return undefined;
												}
												return {
													id: cat.id,
													name: cat.name ?? "",
													color: cat.color ?? null,
													slug: cat.slug ?? null,
												};
											})
											.filter(
												(cat): cat is NonNullable<typeof cat> =>
													cat !== undefined
											)
											.find((cat) => cat.slug === field.value)}
									/>
								</FormControl>
								<FormDescription>
									Help organize and track your transactions
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="assignedId"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Assign</FormLabel>
								<FormControl>
									<AssignUser
										onSelect={(user) => {
											field.onChange(user?.id);
										}}
										selectedId={field.value}
									/>
								</FormControl>
								<FormDescription>
									Assign this transaction to a team member
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
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
								<TransactionAttachments
									attachments={formAttachments}
									onChange={setFormAttachments}
								/>
							</div>
						</AccordionContent>
					</AccordionItem>

					<div className="mt-6 mb-4">
						<Label
							className="mb-2 block font-medium text-md"
							htmlFor="settings"
						>
							Exclude from reports
						</Label>
						<div className="flex flex-row items-center justify-between">
							<div className="space-y-0.5 pr-4">
								<p className="text-muted-foreground text-xs">
									Exclude this transaction from reports like profit, expense and
									revenue. This is useful for internal transfers between
									accounts to avoid double-counting.
								</p>
							</div>

							<FormField
								control={form.control}
								name="internal"
								render={({ field }) => (
									<Switch
										checked={field.value ?? false}
										onCheckedChange={(checked) => {
											field.onChange(checked);
										}}
									/>
								)}
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
									onChange={(e) => {
										form.setValue("note", e.target.value);
									}}
									placeholder="Note"
									value={form.watch("note") ?? ""}
								/>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>

				<div className="fixed bottom-8 right-8 w-full sm:max-w-[455px]">
					<SubmitButton
						className="w-full"
						disabled={!form.formState.isDirty}
						isSubmitting={isPending}
					>
						Create
					</SubmitButton>
				</div>
			</form>
		</Form>
	);
}
