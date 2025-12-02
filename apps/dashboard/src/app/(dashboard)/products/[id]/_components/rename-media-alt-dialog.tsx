"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc/client";

interface RenameMediaAltDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: {
    id: string;
    alt?: string | null;
  } | null;
  productId: string;
}

export function RenameMediaAltDialog({
  open,
  onOpenChange,
  media,
  productId,
}: RenameMediaAltDialogProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [altText, setAltText] = useState("");

  useEffect(() => {
    if (open && media) {
      setAltText(media.alt || "");
    }
  }, [open, media]);

  const updateMutation = trpc.products.mediaUpdate.useMutation({
    onSuccess: () => {
      toast({ description: "Alt text updated" });
      void utils.products.details.invalidate({ id: productId });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to update",
      });
    },
  });

  const handleSave = async () => {
    if (!media) return;
    await updateMutation.mutateAsync({ id: media.id, alt: altText });
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Alt Text</AlertDialogTitle>
          <AlertDialogDescription>
            Update the alternative text description for this image to improve
            accessibility.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium" htmlFor="alt-text">
            Alt Text
          </label>
          <Input
            autoFocus
            className="mt-2"
            disabled={updateMutation.isPending}
            id="alt-text"
            onChange={(e) => setAltText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !updateMutation.isPending) {
                handleSave();
              }
            }}
            placeholder="Describe the image"
            value={altText}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={updateMutation.isPending}
            onClick={handleSave}
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
