"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectCurrency } from "@/components/select-currency";
import { useTeamCurrency } from "@/hooks/use-team-currency";
import { trpc } from "@/lib/trpc/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function CreateAccountDialog({ open, onOpenChange, onCreated }: Props) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [type, setType] = useState<"cash" | "bank" | "mobile_money" | "card" | "other">("cash");
  const teamCurrency = useTeamCurrency();
  const [currency, setCurrency] = useState(teamCurrency);

  useEffect(() => {
    // Ensure currency defaults to team currency when dialog opens
    if (open) setCurrency((c) => c || teamCurrency);
  }, [open, teamCurrency]);

  const { mutateAsync, isPending } = trpc.transactions.accountsCreate.useMutation({
    onSuccess: async () => {
      await utils.transactions.accounts.invalidate();
      onCreated?.();
      onOpenChange(false);
      setName("");
      setType("cash");
      setCurrency(teamCurrency);
    },
  });

  const submit = async () => {
    if (!name.trim()) return;
    await mutateAsync({ name: name.trim(), type, currency });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[520px] p-6">
        <DialogHeader>
          <DialogTitle>Create account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs" htmlFor="account-name">
              Name
            </label>
            <Input
              id="account-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Business Checking, Operating Account"
              value={name}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs" htmlFor="account-type">
                Type
              </label>
              <Select onValueChange={(v) => setType(v as any)} value={type}>
                <SelectTrigger id="account-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs" htmlFor="account-currency">
                Currency
              </label>
              <SelectCurrency className="w-full" onChange={setCurrency} value={currency} />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button disabled={isPending} onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button disabled={!name.trim() || isPending} onClick={submit}>
            {isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
