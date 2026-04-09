"use client";

import { Button } from "@faworra-new/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@faworra-new/ui/components/sheet";
import { Separator } from "@faworra-new/ui/components/separator";
import { Textarea } from "@faworra-new/ui/components/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Check,
  CreditCard,
  Edit2,
  FileText,
  MoreHorizontal,
  Paperclip,
  Save,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { InlineSelectCategory } from "@/components/inline-select-category";
import { useTRPC } from "@/trpc/client";

interface TransactionDetail {
  amount: number;
  bankAccount?: { id: string; name: string } | null;
  category?: { color: string; id: string; name: string; slug: string } | null;
  createdAt: Date;
  currency: string;
  description: string;
  id: string;
  internal: boolean;
  // Note: 'kind' removed - income/expense determined by amount sign
  // amount > 0 = income, amount < 0 = expense
  manual: boolean;
  note: string | null;
  status: "excluded" | "pending" | "posted";
  transactionDate: Date | string;
  updatedAt: Date;
}

interface TransactionDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  transactionId: string | null;
}

function formatAmount(amount: number, currency: string) {
  const absAmount = Math.abs(amount / 100);
  const isNegative = amount < 0;

  try {
    const formatted = new Intl.NumberFormat("en-US", {
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      style: "currency",
    }).format(absAmount);
    return isNegative ? `-${formatted}` : `+${formatted}`;
  } catch {
    return `${isNegative ? "-" : "+"}${absAmount.toFixed(2)} ${currency}`;
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function TransactionDetailDrawer({
  onClose,
  open,
  transactionId,
}: TransactionDetailDrawerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"details" | "attachments">(
    "details",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState("");

  const { data: transaction } = useQuery({
    ...trpc.transactions.getById.queryOptions({ id: transactionId! }),
    enabled: !!transactionId && open,
  });

  const { data: attachments = [] } = useQuery({
    ...trpc.transactions.getAttachments.queryOptions({
      transactionId: transactionId!,
    }),
    enabled: !!transactionId && open,
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation(
    trpc.transactions.updateMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
        });
        toast.success("Transaction updated");
      },
      onError: () => {
        toast.error("Failed to update transaction");
      },
    }),
  );

  // Set review state mutation
  const setReviewStateMutation = useMutation(
    trpc.transactions.setReviewState.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
        });
        toast.success("Status updated");
      },
    }),
  );

  // Delete mutation
  const deleteTransactionMutation = useMutation(
    trpc.transactions.deleteMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.list.queryKey(),
        });
        onClose();
        toast.success("Transaction deleted");
      },
    }),
  );

  const addAttachmentMutation = useMutation(
    trpc.transactions.addAttachment.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Failed to upload attachment");
      },
      onSuccess: async () => {
        toast.success("Attachment uploaded");
        await queryClient.invalidateQueries();
      },
    }),
  );

  const removeAttachmentMutation = useMutation(
    trpc.transactions.removeAttachment.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Failed to remove attachment");
      },
      onSuccess: async () => {
        toast.success("Attachment removed");
        await queryClient.invalidateQueries();
      },
    }),
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !transactionId) return;

    const file = files[0];

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are allowed");
      return;
    }

    setIsUploading(true);

    try {
      await addAttachmentMutation.mutateAsync({
        filename: file.name,
        mimeType: file.type,
        path: `attachments/${transactionId}/${file.name}`,
        size: file.size,
        transactionId,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle status change
  const handleStatusChange = (status: "posted" | "excluded") => {
    if (!transactionId) return;
    setReviewStateMutation.mutate({
      id: transactionId,
      status,
    });
  };

  // Handle category change
  const handleCategoryChange = (category: {
    id: string;
    name: string;
    slug: string | null;
    color?: string | null;
  }) => {
    if (!transactionId) return;
    updateTransactionMutation.mutate({
      ids: [transactionId],
      categoryId: category.id,
    });
  };

  // Handle note save
  const handleSaveNote = () => {
    if (!transactionId) return;
    updateTransactionMutation.mutate({
      ids: [transactionId],
      // Note: updateMany doesn't support note updates yet, this is a placeholder
    });
    setEditingNote(false);
    toast.info("Note updates coming soon");
  };

  // Handle delete
  const handleDelete = () => {
    if (!transactionId || !transaction?.manual) return;
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteTransactionMutation.mutate({ ids: [transactionId] });
    }
  };

  if (!transaction) return null;

  // Use amount sign to determine income/expense (Midday pattern)
  const isExpense = transaction.amount < 0;

  return (
    <Sheet onOpenChange={onClose} open={open}>
      <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto rounded-none">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            {isExpense ? (
              <ArrowDownCircle className="h-5 w-5 text-rose-500" />
            ) : (
              <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
            )}
            <span className={isExpense ? "text-rose-500" : "text-emerald-500"}>
              {formatAmount(transaction.amount, transaction.currency)}
            </span>
          </SheetTitle>
          <SheetDescription>{transaction.description}</SheetDescription>
        </SheetHeader>

        {/* Action buttons */}
        <div className="flex gap-2 mb-4">
          {transaction.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 hover:text-emerald-600"
                onClick={() => handleStatusChange("posted")}
                disabled={setReviewStateMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                Post
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-amber-600 hover:text-amber-600"
                onClick={() => handleStatusChange("excluded")}
                disabled={setReviewStateMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Exclude
              </Button>
            </>
          )}
          {transaction.status === "excluded" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("posted")}
              disabled={setReviewStateMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Include
            </Button>
          )}
          {transaction.status === "posted" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("excluded")}
              disabled={setReviewStateMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Exclude
            </Button>
          )}
          {transaction.manual && (
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 hover:text-rose-600"
              onClick={handleDelete}
              disabled={deleteTransactionMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-2 mb-4">
          <Button
            className="rounded-none"
            onClick={() => setActiveTab("details")}
            size="sm"
            variant={activeTab === "details" ? "default" : "ghost"}
          >
            Details
          </Button>
          <Button
            className="rounded-none"
            onClick={() => setActiveTab("attachments")}
            size="sm"
            variant={activeTab === "attachments" ? "default" : "ghost"}
          >
            <Paperclip className="mr-1 h-3.5 w-3.5" />
            Attachments ({attachments.length})
          </Button>
        </div>

        {activeTab === "details" && (
          <div className="space-y-4">
            {/* Status & Internal */}
            <div className="flex gap-2">
              <div
                className={`px-2 py-1 text-xs font-medium rounded ${
                  transaction.status === "posted"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                    : transaction.status === "pending"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {transaction.status}
              </div>
              {transaction.internal && (
                <div className="px-2 py-1 text-xs font-medium rounded bg-muted text-muted-foreground">
                  Internal
                </div>
              )}
              {transaction.manual && (
                <div className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Manual
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <div className="text-muted-foreground text-xs mb-1">
                Description
              </div>
              <div className="font-medium">{transaction.description}</div>
            </div>

            {/* Note */}
            <div>
              <div className="text-muted-foreground text-xs mb-1 flex items-center justify-between">
                <span>Note</span>
                {!editingNote && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => {
                      setNoteValue(transaction.note ?? "");
                      setEditingNote(true);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {editingNote ? (
                <div className="space-y-2">
                  <Textarea
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={updateTransactionMutation.isPending}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingNote(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  {transaction.note || "No note"}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {formatDate(transaction.transactionDate)}
              </span>
            </div>

            <Separator />

            {/* Category - Inline editable */}
            <div>
              <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Category
              </div>
              <InlineSelectCategory
                selected={
                  transaction.category
                    ? {
                        id: transaction.category.id,
                        name: transaction.category.name,
                        color: transaction.category.color,
                        slug: transaction.category.slug,
                      }
                    : undefined
                }
                onChange={handleCategoryChange}
              />
            </div>

            {/* Account */}
            <div>
              <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Account
              </div>
              <div>{transaction.bankAccount?.name ?? "Manual / Unassigned"}</div>
            </div>

            <Separator />

            {/* Metadata */}
            <div className="text-muted-foreground text-xs space-y-1">
              <div>ID: {transaction.id}</div>
              <div>Created: {formatDate(transaction.createdAt)}</div>
              <div>Updated: {formatDate(transaction.updatedAt)}</div>
            </div>
          </div>
        )}

        {activeTab === "attachments" && (
          <div className="space-y-4">
            {attachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No attachments</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Upload receipts and documents to this transaction
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 border border-border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {attachment.filename}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {Math.round(attachment.size / 1024)} KB •{" "}
                          {attachment.mimeType}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        removeAttachmentMutation.mutate({ id: attachment.id })
                      }
                      disabled={removeAttachmentMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              className="w-full"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload file"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              PDF, JPG, PNG up to 10MB
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
