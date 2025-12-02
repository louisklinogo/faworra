"use client";

import { useEffect, useMemo, useState } from "react";
import { MdAdd, MdDelete } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type SignatureTemplate = {
  id: string;
  label: string;
  text: string;
  updatedAt: number;
};

type SignatureManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signatures: SignatureTemplate[];
  onSave: (signatures: SignatureTemplate[]) => void;
};

export function SignatureManagerDialog({ open, onOpenChange, signatures, onSave }: SignatureManagerDialogProps) {
  const [drafts, setDrafts] = useState<SignatureTemplate[]>(signatures);

  useEffect(() => {
    if (open) setDrafts(signatures);
  }, [open, signatures]);

  const canSave = useMemo(() => drafts.every((sig) => sig.label.trim() && sig.text.trim()), [drafts]);

  const addSignature = () => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    setDrafts((prev) => [
      ...prev,
      {
        id,
        label: `Signature ${prev.length + 1}`,
        text: "Regards,\nYour Name",
        updatedAt: Date.now(),
      },
    ]);
  };

  const updateSignature = (id: string, patch: Partial<SignatureTemplate>) => {
    setDrafts((prev) =>
      prev.map((sig) => (sig.id === id ? { ...sig, ...patch, updatedAt: Date.now() } : sig)),
    );
  };

  const removeSignature = (id: string) => {
    setDrafts((prev) => prev.filter((sig) => sig.id !== id));
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave(drafts.map((sig) => ({ ...sig, updatedAt: Date.now() })));
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage signatures</DialogTitle>
          <DialogDescription>Organize the signatures available in the inbox composer.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {drafts.map((signature) => (
            <div className="rounded-md border p-4" key={signature.id}>
              <div className="mb-3 flex items-center gap-3">
                <Input
                  onChange={(event) => updateSignature(signature.id, { label: event.target.value })}
                  placeholder="Signature label"
                  value={signature.label}
                />
                <Button onClick={() => removeSignature(signature.id)} size="icon" variant="ghost">
                  <MdDelete className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                className="min-h-[120px]"
                onChange={(event) => updateSignature(signature.id, { text: event.target.value })}
                placeholder="Signature content"
                value={signature.text}
              />
            </div>
          ))}

          <Button onClick={addSignature} type="button" variant="outline">
            <MdAdd className="mr-2 h-4 w-4" /> Add signature
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={!canSave || drafts.length === 0} onClick={handleSave} type="button">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
