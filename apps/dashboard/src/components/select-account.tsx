"use client";

import { trpc } from "@/lib/trpc/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Account = { id: string; name: string; currency?: string | null; type?: string | null };

type Props = {
  value?: string;
  onChange: (account: Account) => void;
  placeholder?: string;
  className?: string;
};

export function SelectAccount({ value, onChange, placeholder = "Select account", className }: Props) {
  const { data: accounts = [] } = trpc.financialAccounts.list.useQuery(undefined, { staleTime: 60_000 });

  return (
    <Select value={value} onValueChange={(id) => {
      const acc = (accounts as any[]).find((a) => a.id === id);
      if (acc) onChange({ id: acc.id, name: acc.name, currency: acc.currency, type: acc.type });
    }}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {(accounts as any[]).map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.currency ? `${a.name} (${a.currency})` : a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
