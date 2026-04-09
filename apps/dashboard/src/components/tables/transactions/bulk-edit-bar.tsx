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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Portal } from "@/components/portal";
import { SelectCategory } from "@/components/select-category";
import { useTransactionsStore } from "@/store/transactions";
import { trpc } from "@/utils/trpc";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@faworra-new/ui/components/popover";

export function BulkEditBar() {
  const queryClient = useQueryClient();
  const { rowSelectionByTab, setRowSelection } = useTransactionsStore();
  const [isOpen, setOpen] = useState(false);

  // BulkEditBar is only shown on "all" tab
  const rowSelection = rowSelectionByTab.all;
  const selectedCount = Object.keys(rowSelection).length;
  const hasSelection = selectedCount > 0;

  // Fetch categories for bulk assignment
  const { data: categories = [] } = useQuery(trpc.transactions.categories.queryOptions());

  // Delete mutation for bulk delete
  const deleteTransactionsMutation = useMutation(
    trpc.transactions.deleteMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.list.queryKey(),
        });
        setRowSelection("all", {});
      },
    }),
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
    }),
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
            className="h-12 fixed bottom-6 left-0 right-0 pointer-events-none flex justify-center z-50"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative pointer-events-auto min-w-[500px] h-12">
              {/* Blur layer fades in separately to avoid backdrop-filter animation issues */}
              <motion.div
                className="absolute inset-0 backdrop-filter backdrop-blur-lg bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
              <div className="relative h-12 justify-between items-center flex pl-4 pr-2">
                <span className="text-sm">{selectedCount} selected</span>

                <div className="flex items-center space-x-2">
                  {/* Bulk Post */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950"
                    onClick={() => handleBulkStatus("posted")}
                    disabled={updateManyMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Post
                  </Button>

                  {/* Bulk Exclude */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-600 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950"
                    onClick={() => handleBulkStatus("excluded")}
                    disabled={updateManyMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Exclude
                  </Button>

                  {/* Bulk Category */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={updateManyMutation.isPending}
                      >
                        Category
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[250px]" align="end">
                      <div className="p-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
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
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                            deleteTransactionsMutation.mutate({ ids: transactionIds });
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
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setRowSelection("all", {})}
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
