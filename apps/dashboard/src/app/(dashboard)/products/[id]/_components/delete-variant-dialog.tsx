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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc/client";

interface DeleteVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: {
    id: string;
    name?: string | null;
    sku?: string | null;
  } | null;
  productId: string;
}

export function DeleteVariantDialog({
  open,
  onOpenChange,
  variant,
  productId,
}: DeleteVariantDialogProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.products.variantDelete.useMutation({
    onSuccess: async () => {
      toast({ description: "Variant deleted successfully" });
      await Promise.all([
        utils.products.details.invalidate({ id: productId }),
        utils.products.stats.invalidate(),
        utils.products.topCategories.invalidate(),
      ]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to delete variant",
      });
    },
  });

  const handleDelete = async () => {
    if (!variant) return;
    await deleteMutation.mutateAsync({ id: variant.id });
  };

  const variantDisplayName =
    variant?.name || variant?.sku || "this variant";

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this variant?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{variantDisplayName}</strong>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Variant"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
