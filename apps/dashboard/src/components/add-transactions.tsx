"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useTransactionParams } from "@/hooks/use-transaction-params";

type Props = {
  onCreate?: () => void;
  onCreateAccount?: () => void;
  showCreateAccount?: boolean;
};

export function AddTransactions({ onCreate, onCreateAccount, showCreateAccount }: Props) {
  const { open } = useTransactionParams();
  const [_, setParams] = useQueryStates({ step: parseAsString, hide: parseAsBoolean });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <Icons.Add className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10}>
        <DropdownMenuItem
          className="space-x-2"
          onClick={() => {
            if (onCreate) onCreate();
            else open();
          }}
        >
          <Icons.CreateTransaction className="h-4 w-4" />
          <span>Create transaction</span>
        </DropdownMenuItem>
        {showCreateAccount && (
          <DropdownMenuItem
            className="space-x-2"
            onClick={() => {
              onCreateAccount?.();
            }}
          >
            <Icons.Accounts className="h-4 w-4" />
            <span>Create account</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="space-x-2"
          onClick={() => {
            setParams({ step: "import", hide: true });
          }}
        >
          <Icons.Import className="h-4 w-4" />
          <span>Import/backfill</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
