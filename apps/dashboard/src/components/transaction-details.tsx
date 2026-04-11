"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@faworra-new/ui/components/accordion";
import { Label } from "@faworra-new/ui/components/label";
import { Skeleton } from "@faworra-new/ui/components/skeleton";
import { Switch } from "@faworra-new/ui/components/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTRPC } from "@/trpc/client";
import { AssignUser } from "./assign-user";
import { FormatAmount } from "./format-amount";
import { Note } from "./note";
import { SelectCategory } from "./select-category";
import { SelectTags } from "./select-tags";

export function TransactionDetails() {
	const trpc = useTRPC();
	const { transactionId } = useTransactionParams();
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		...trpc.transactions.getById.queryOptions({ id: transactionId! }),
		enabled: Boolean(transactionId),
		staleTime: 30 * 1000,
		placeholderData: () => {
			const pages = queryClient
				.getQueriesData({ queryKey: trpc.transactions.list.infiniteQueryKey() })
				.flatMap(([, listData]) => (listData as any)?.pages ?? [])
				.flatMap((page) => page?.data ?? []);

			return pages.find((d: any) => d.id === transactionId);
		},
	});

	// Bulk update for category and assignedId
	const bulkUpdateMutation = useMutation(
		trpc.transactions.updateMany.mutationOptions({
			onSuccess: () => {
				toast.success("Transaction updated");
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.list.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update transaction");
			},
		})
	);

	// Single transaction update for internal, note, etc.
	const updateMutation = useMutation(
		trpc.transactions.update.mutationOptions({
			onSuccess: () => {
				toast.success("Transaction updated");
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.list.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update transaction");
			},
		})
	);

	const createTransactionTagMutation = useMutation(
		trpc.transactionTags.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.list.queryKey(),
				});
			},
		})
	);

	const deleteTransactionTagMutation = useMutation(
		trpc.transactionTags.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.list.queryKey(),
				});
			},
		})
	);

	if (!transactionId) {
		return null;
	}

	if (isLoading || !data) {
		return (
			<div className="scrollbar-hide h-[calc(100vh-80px)] overflow-auto pb-12">
				<div className="mb-8 flex justify-between">
					<div className="flex-1 flex-col">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<Skeleton className="size-5 rounded-full" />
								<Skeleton className="h-[14px] w-[100px]" />
							</div>
							<Skeleton className="h-[14px] w-[80px]" />
						</div>

						<div className="mt-6 mb-3">
							<Skeleton className="h-[22px] w-[35%]" />
						</div>

						<div className="w-full flex-col space-y-1">
							<Skeleton className="h-[36px] w-[50%]" />
							<Skeleton className="h-[12px] w-[60px]" />
						</div>
					</div>
				</div>

				<div className="mt-6 mb-2 grid grid-cols-2 gap-4">
					<div>
						<Skeleton className="mb-2 h-[14px] w-[60px]" />
						<Skeleton className="h-[36px] w-full" />
					</div>
					<div>
						<Skeleton className="mb-2 h-[14px] w-[50px]" />
						<Skeleton className="h-[36px] w-full" />
					</div>
				</div>

				<div className="mt-6">
					<Skeleton className="mb-2 h-[14px] w-[40px]" />
					<Skeleton className="h-[36px] w-full" />
				</div>

				<div className="mt-8 space-y-4">
					<Skeleton className="h-[20px] w-full" />
					<Skeleton className="h-[20px] w-full" />
					<Skeleton className="h-[20px] w-full" />
				</div>
			</div>
		);
	}

	const defaultValue = ["general"];
	if (data?.note) {
		defaultValue.push("note");
	}

	return (
		<div className="scrollbar-hide h-[calc(100vh-80px)] overflow-auto pb-12">
			{/* Header */}
			<div className="mb-8 flex justify-between">
				<div className="flex-1 flex-col">
					<div className="flex items-center justify-between">
						<div className="flex items-center justify-between">
							{data?.bankAccount?.name && (
								<span className="text-[#606060] text-xs">
									{data.bankAccount.name}
								</span>
							)}
							<span className="select-text text-[#606060] text-xs">
								{data?.transactionDate &&
									format(new Date(data.transactionDate), "MMM d, y")}
							</span>
						</div>
					</div>

					{/* Transaction name */}
					<h2 className="mt-6 mb-3 select-text">{data?.name}</h2>

					{/* Amount */}
					<div className="flex items-center justify-between">
						<div className="w-full flex-col space-y-1">
							<span
								className={cn(
									"select-text font-serif text-4xl",
									data?.amount > 0 && "text-[#00C969]"
								)}
							>
								<FormatAmount
									amount={data?.amount}
									currency={data?.currency ?? "GHS"}
								/>
							</span>
							<div className="h-3">
								{data?.taxAmount && data.taxAmount > 0 ? (
									<span className="select-text text-[#606060] text-xs">
										{data.taxType && `${data.taxType} `}
										<FormatAmount
											amount={data.taxAmount}
											currency={data?.currency ?? "GHS"}
											maximumFractionDigits={2}
										/>
									</span>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Description box */}
			{data?.description && (
				<div className="select-text border px-4 py-3 text-popover-foreground text-sm dark:bg-[#1A1A1A]/95">
					{data.description}
				</div>
			)}

			{/* Category and Assign User grid */}
			<div className="mt-6 mb-2 grid grid-cols-2 gap-4">
				<div>
					<Label className="mb-2 block" htmlFor="category">
						Category
					</Label>

					<SelectCategory
						onChange={(category) => {
							bulkUpdateMutation.mutate({
								ids: [transactionId],
								categoryId: category.id,
							});
						}}
						selected={
							data?.category
								? {
										id: data.category.id,
										name: data.category.name ?? "",
										color: data.category.color,
										slug: data.category.slug,
									}
								: undefined
						}
					/>
				</div>

				<div>
					<Label className="mb-2 block" htmlFor="assign">
						Assign
					</Label>

					<AssignUser
						onSelect={(user) => {
							if (user) {
								bulkUpdateMutation.mutate({
									ids: [transactionId],
									assignedId: user.id,
								});
							}
						}}
						selectedId={data?.assignedId ?? undefined}
					/>
				</div>
			</div>

			{/* Tags */}
			<div className="mt-6">
				<Label className="mb-2 block" htmlFor="tags">
					Tags
				</Label>

				<SelectTags
					key={data?.id + data?.tags?.length}
					onRemove={(tag) => {
						if (tag.id) {
							deleteTransactionTagMutation.mutate({
								tagId: tag.id,
								transactionId,
							});
						}
					}}
					onSelect={(tag) => {
						if (tag.id) {
							createTransactionTagMutation.mutate({
								tagId: tag.id,
								transactionId,
							});
						}
					}}
					tags={data?.tags?.map((tag) => ({
						id: tag.id,
						label: tag.name ?? "",
						value: tag.name ?? "",
					}))}
				/>
			</div>

			{/* Accordion sections */}
			<Accordion defaultValue={defaultValue} type="multiple">
				<AccordionItem value="general">
					<AccordionTrigger>General</AccordionTrigger>
					<AccordionContent className="select-text">
						<div className="mb-4 border-b pb-4">
							<Label className="mb-2 block font-medium text-md">
								Exclude from reports
							</Label>
							<div className="flex flex-row items-center justify-between">
								<div className="space-y-0.5 pr-4">
									<p className="text-muted-foreground text-xs">
										Exclude this transaction from reports like profit, expense
										and revenue. This is useful for internal transfers between
										accounts to avoid double-counting.
									</p>
								</div>

								<Switch
									checked={data?.internal ?? false}
									onCheckedChange={(checked) => {
										updateMutation.mutate({
											id: transactionId,
											internal: checked,
										});
									}}
								/>
							</div>
						</div>
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="note">
					<AccordionTrigger>Note</AccordionTrigger>
					<AccordionContent className="select-text">
						<Note
							defaultValue={data?.note ?? ""}
							onChange={(value) => {
								updateMutation.mutate({
									id: transactionId,
									note: value,
								});
							}}
						/>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

// Helper for cn (conditional class names)
function cn(...classes: (string | boolean | undefined)[]) {
	return classes.filter(Boolean).join(" ");
}
