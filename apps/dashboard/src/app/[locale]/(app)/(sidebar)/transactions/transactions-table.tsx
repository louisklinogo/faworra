"use client";

import { Button } from "@faworra-new/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@faworra-new/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import TransactionForm from "./transaction-form";

interface TransactionsTableProps {
	defaultCurrency: string;
}

export default function TransactionsTable({
	defaultCurrency,
}: TransactionsTableProps) {
	const queryClient = useQueryClient();
	const [editingTransactionId, setEditingTransactionId] = useState<
		string | null
	>(null);
	const categories = useQuery(trpc.transactions.categories.queryOptions());
	const transactions = useQuery(trpc.transactions.get.queryOptions());
	const editingTransaction =
		transactions.data?.find(
			(transaction) => transaction.id === editingTransactionId
		) ?? null;

	const createTransactionMutation = useMutation(
		trpc.transactions.create.mutationOptions({
			onSuccess: async () => {
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: trpc.transactions.get.queryKey(),
					}),
					queryClient.invalidateQueries({
						queryKey: trpc.overview.summary.queryKey(),
					}),
				]);
				toast.success("Transaction created");
			},
		})
	);

	const updateTransactionMutation = useMutation(
		trpc.transactions.update.mutationOptions({
			onSuccess: async () => {
				setEditingTransactionId(null);
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: trpc.transactions.get.queryKey(),
					}),
					queryClient.invalidateQueries({
						queryKey: trpc.overview.summary.queryKey(),
					}),
				]);
				toast.success("Transaction updated");
			},
		})
	);

	const isPending =
		createTransactionMutation.isPending || updateTransactionMutation.isPending;

	return (
		<div className="rounded-none border border-border bg-background">
			<TransactionForm
				categories={categories.data ?? []}
				defaultCurrency={defaultCurrency}
				isPending={isPending}
				onCancel={
					editingTransactionId ? () => setEditingTransactionId(null) : undefined
				}
				onSubmit={async (input) => {
					if (input.id) {
						await updateTransactionMutation.mutateAsync({
							amount: input.amount,
							categoryId: input.categoryId,
							currency: input.currency,
							description: input.description,
							id: input.id,
							kind: input.kind,
							transactionDate: input.transactionDate,
						});
						return;
					}

					await createTransactionMutation.mutateAsync({
						amount: input.amount,
						categoryId: input.categoryId,
						currency: input.currency,
						description: input.description,
						kind: input.kind,
						transactionDate: input.transactionDate,
					});
				}}
				transaction={editingTransaction}
			/>

			<div className="flex items-center justify-between border-border border-b px-4 py-3">
				<h2 className="font-medium text-sm">Transactions</h2>
				<div className="text-muted-foreground text-sm">
					{transactions.data?.length ?? 0} records
				</div>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Description</TableHead>
						<TableHead>Kind</TableHead>
						<TableHead>Currency</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{transactions.data?.length ? (
						transactions.data.map((transaction) => (
							<TableRow key={transaction.id}>
								<TableCell className="font-medium">
									{transaction.description}
								</TableCell>
								<TableCell>{transaction.kind}</TableCell>
								<TableCell>{transaction.currency}</TableCell>
								<TableCell>{transaction.amount}</TableCell>
								<TableCell>
									{new Date(transaction.transactionDate).toLocaleDateString()}
								</TableCell>
								<TableCell>
									{transaction.category?.name ?? "Uncategorized"}
								</TableCell>
								<TableCell>
									<Button
										onClick={() => {
											setEditingTransactionId(transaction.id);
										}}
										size="sm"
										variant="outline"
									>
										Edit
									</Button>
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell className="text-muted-foreground" colSpan={7}>
								No transactions yet. Use the form above to add your first real
								record.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
