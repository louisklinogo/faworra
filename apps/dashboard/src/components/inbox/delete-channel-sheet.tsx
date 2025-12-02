"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DeleteChannelSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: string;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DeleteChannelSheet({
  open,
  onOpenChange,
  provider,
  onConfirm,
  isLoading,
}: DeleteChannelSheetProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Delete {provider}?</SheetTitle>
          <SheetDescription>
            Removing this channel permanently deletes its threads, messages, and queued sends.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 py-6">
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. If you reconnect later, you&rsquo;ll start with a fresh inbox for
            this channel.
          </p>
        </div>

        <SheetFooter>
          <Button disabled={isLoading} onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button className="gap-2" disabled={isLoading} onClick={onConfirm} variant="destructive">
            {isLoading ? "Deleting…" : "Delete"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
