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

interface DeleteMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: {
    id: string;
    alt?: string | null;
  } | null;
  productId: string;
}

export function DeleteMediaDialog({
  open,
  onOpenChange,
  media,
  productId,
}: DeleteMediaDialogProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.products.deleteMedia.useMutation({
    onSuccess: () => {
      toast({ description: "Media deleted successfully" });
      void utils.products.details.invalidate({ id: productId });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to delete media",
      });
    },
  });

  const handleDelete = async () => {
    if (!media) return;
    await deleteMutation.mutateAsync({ productId, mediaId: media.id });
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this image?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <strong>{media?.alt || "this image"}</strong>. This action cannot be
            undone.
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
            {deleteMutation.isPending ? "Deleting..." : "Delete Image"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
