"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc/client";

interface ConfigureEmailChannelDialogProps {
  accountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerLabel: string;
}

type FormState = {
  fromEmail: string;
  fromName: string;
  replyTo: string;
  defaultSubject: string;
};

const EMPTY_STATE: FormState = {
  fromEmail: "",
  fromName: "",
  replyTo: "",
  defaultSubject: "",
};

export function ConfigureEmailChannelDialog({ accountId, open, onOpenChange, providerLabel }: ConfigureEmailChannelDialogProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [form, setForm] = useState<FormState>(EMPTY_STATE);

  const enabled = open && Boolean(accountId);
  const { data, isFetching } = trpc.communications.accountConfig.useQuery(
    { accountId: accountId || "" },
    { enabled },
  );

  const updateMutation = trpc.communications.updateEmailConfig.useMutation({
    onSuccess: async () => {
      toast({ title: "Saved", description: "Email channel preferences updated." });
      await utils.communications.accounts.invalidate();
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        title: "Failed to save",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!enabled) {
      setForm(EMPTY_STATE);
      return;
    }
    if (data?.config) {
      const cfg = data.config as Record<string, unknown>;
      setForm({
        fromEmail: typeof cfg.fromEmail === "string" ? cfg.fromEmail : "",
        fromName: typeof cfg.fromName === "string" ? cfg.fromName : "",
        replyTo: typeof cfg.replyTo === "string" ? cfg.replyTo : "",
        defaultSubject: typeof cfg.defaultSubject === "string" ? cfg.defaultSubject : "",
      });
    } else {
      setForm(EMPTY_STATE);
    }
  }, [enabled, data?.config]);

  const isSaving = updateMutation.isPending;
  const submitDisabled = !form.fromEmail || isSaving;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountId) return;
    updateMutation.mutate({
      accountId,
      fromEmail: form.fromEmail.trim(),
      fromName: form.fromName.trim() || undefined,
      replyTo: form.replyTo.trim() || undefined,
      defaultSubject: form.defaultSubject.trim() || undefined,
    });
  };

  const title = useMemo(() => `Configure ${providerLabel || "Email"}`, [providerLabel]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Set the default sender details and reply handling for this email channel. These values
            are used when sending replies through the inbox composer.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground" htmlFor="fromEmail">
              From email
            </label>
            <Input
              id="fromEmail"
              placeholder="support@example.com"
              required
              type="email"
              value={form.fromEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, fromEmail: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground" htmlFor="fromName">
              From name (optional)
            </label>
            <Input
              id="fromName"
              placeholder="Faworra Support"
              value={form.fromName}
              onChange={(event) => setForm((prev) => ({ ...prev, fromName: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground" htmlFor="replyTo">
              Reply-To (optional)
            </label>
            <Input
              id="replyTo"
              placeholder="inbox@example.com"
              type="email"
              value={form.replyTo}
              onChange={(event) => setForm((prev) => ({ ...prev, replyTo: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground" htmlFor="defaultSubject">
              Default subject (optional)
            </label>
            <Input
              id="defaultSubject"
              maxLength={240}
              placeholder="New conversation"
              value={form.defaultSubject}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, defaultSubject: event.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button disabled={isFetching || isSaving} onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={submitDisabled} type="submit">
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
