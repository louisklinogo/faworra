"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@faworra-new/ui/components/alert-dialog";
import { Button } from "@faworra-new/ui/components/button";
import { Icons } from "@faworra-new/ui/components/icons";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@faworra-new/ui/components/popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Portal } from "@/components/portal";
import { SelectCategory } from "@/components/select-category";
import { useTransactionsStore } from "@/store/transactions";
import { trpc } from "@/utils/trpc";

export function BulkEditBar() {
	const queryClient = useQueryClient();
	const { rowSelectionByTab, setRowSelection } = useTransactionsStore();
	const [isOpen, setOpen] = useState(false);

	// BulkEditBar is only shown on "all" tab
	const rowSelection = rowSelectionByTab.all;
	const selectedCount = Object.keys(rowSelection).length;
	const hasSelection = selectedCount > 0;

	// Fetch categories for bulk assignment
	const { data: categories = [] } = useQuery(
		trpc.transactions.categories.queryOptions()
	);

	// Delete mutation for bulk delete
	const deleteTransactionsMutation = useMutation(
		trpc.transactions.deleteMany.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.list.queryKey(),
				});
				setRowSelection("all", {});
			},
		})
	);

	// Update many mutation for bulk status/category
	const updateManyMutation = useMutation(
		trpc.transactions.updateMany.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.list.queryKey(),
				});
				setRowSelection("all", {});
			},
		})
	);

	// Show bar when transactions are selected
	const shouldShow = hasSelection;

	useEffect(() => {
		setOpen(shouldShow);
	}, [shouldShow]);

	const transactionIds = Object.keys(rowSelection);

	// Handle bulk status change
	const handleBulkStatus = (status: "posted" | "excluded") => {
		updateManyMutation.mutate({
			ids: transactionIds,
			status,
		});
	};

	// Handle bulk category change
	const handleBulkCategory = (categoryId: string | null) => {
		updateManyMutation.mutate({
			ids: transactionIds,
			categoryId,
		});
	};

	return (
		<Portal>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						animate={{ y: 0 }}
						className="pointer-events-none fixed right-0 bottom-6 left-0 z-50 flex h-12 justify-center"
						exit={{ y: 100 }}
						initial={{ y: 100 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
					>
						<div className="pointer-events-auto relative h-12 min-w-[500px]">
							{/* Blur layer fades in separately to avoid backdrop-filter animation issues */}
							<motion.div
								animate={{ opacity: 1 }}
								className="absolute inset-0 bg-[rgba(247,247,247,0.85)] backdrop-blur-lg backdrop-filter dark:bg-[rgba(19,19,19,0.7)]"
								exit={{ opacity: 0 }}
								initial={{ opacity: 0 }}
								transition={{ duration: 0.15 }}
							/>
							<div className="relative flex h-12 items-center justify-between pr-2 pl-4">
								<span className="text-sm">{selectedCount} selected</span>

								<div className="flex items-center space-x-2">
									{/* Bulk Post */}
									<Button
										className="text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-950"
										disabled={updateManyMutation.isPending}
										onClick={() => handleBulkStatus("posted")}
										size="sm"
										variant="ghost"
									>
										<Check className="mr-1 h-4 w-4" />
										Post
									</Button>

									{/* Bulk Exclude */}
									<Button
										className="text-amber-600 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-950"
										disabled={updateManyMutation.isPending}
										onClick={() => handleBulkStatus("excluded")}
										size="sm"
										variant="ghost"
									>
										<X className="mr-1 h-4 w-4" />
										Exclude
									</Button>

									{/* Bulk Category */}
									<Popover>
										<PopoverTrigger asChild>
											<Button
												disabled={updateManyMutation.isPending}
												size="sm"
												variant="ghost"
											>
												Category
											</Button>
										</PopoverTrigger>
										<PopoverContent align="end" className="w-[250px] p-0">
											<div className="p-2">
												<div className="mb-2 font-medium text-muted-foreground text-xs">
													Set category for {selectedCount} transactions
												</div>
												<SelectCategory
													headless
													onChange={(category) => {
														handleBulkCategory(category.id);
													}}
												/>
											</div>
										</PopoverContent>
									</Popover>

									{/* Delete */}
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												className="text-destructive hover:bg-destructive/10 hover:text-destructive"
												size="icon"
												variant="ghost"
											>
												<Icons.Trash2 size={18} />
											</Button>
										</AlertDialogTrigger>

										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>
													Are you absolutely sure?
												</AlertDialogTitle>
												<AlertDialogDescription>
													This action cannot be undone. This will permanently
													delete your transactions.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => {
														deleteTransactionsMutation.mutate({
															ids: transactionIds,
														});
													}}
												>
													{deleteTransactionsMutation.isPending ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														"Confirm"
													)}
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>

									{/* Deselect */}
									<Button
										className="text-muted-foreground"
										onClick={() => setRowSelection("all", {})}
										size="sm"
										variant="ghost"
									>
										Clear
									</Button>
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</Portal>
	);
}
