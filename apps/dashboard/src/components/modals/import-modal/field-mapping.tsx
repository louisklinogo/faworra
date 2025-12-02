"use client";

// Streaming mapping is fetched from an API route to support AI SDK v5
import { SelectAccount } from "@/components/select-account";
import { SelectCurrency } from "@/components/select-currency";
import { useUserQuery } from "@/hooks/use-user";
import { formatAmount } from "@/utils/format";
import { Label } from "@Faworra/ui";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { Icons } from "@/components/ui/icons";
import { capitalCase } from "change-case";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { mappableFields, useCsvContext } from "./context";

// utils from midday import package replicated here
function formatAmountValue({ amount, inverted }: { amount: string; inverted?: boolean }) {
  let value: number;
  const normalizedAmount = amount.replace(/−/g, "-");
  if (normalizedAmount.includes(",")) value = +normalizedAmount.replace(/\./g, "").replace(",", ".");
  else if (normalizedAmount.match(/\.\d{2}$/)) value = +normalizedAmount.replace(/\.(?=\d{3})/g, "");
  else value = +normalizedAmount;
  return inverted ? +(value * -1) : value;
}

function formatDate(value: string) {
  // Keep simple: trust CSV provides ISO-like dates
  try {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split("T")[0];
  } catch {}
  return value;
}

export function FieldMapping({ currencies }: { currencies: string[] }) {
  const { fileColumns, firstRows, setValue, control, watch } = useCsvContext();
  const [isStreaming, setIsStreaming] = useState(true);
  const [showCurrency, setShowCurrency] = useState(false);

  useEffect(() => {
    if (!fileColumns || !firstRows) return;
    (async () => {
      setIsStreaming(true);
      try {
        const res = await fetch("/api/ai/generate-csv-mapping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldColumns: fileColumns, firstRows }),
        });
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (!line.trim()) continue;
            try {
              const partial = JSON.parse(line) as Record<string, unknown>;
              for (const [field, val] of Object.entries(partial)) {
                if ((Object.keys(mappableFields) as string[]).includes(field) && fileColumns.includes(String(val))) {
                  // @ts-expect-error zod shape matches
                  setValue(field as keyof typeof mappableFields, val, { shouldValidate: true });
                }
              }
            } catch {
              // ignore malformed chunks
            }
          }
        }
      } finally {
        setIsStreaming(false);
      }
    })();
  }, [fileColumns, firstRows, setValue]);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="text-sm">CSV Data column</div>
        <div className="text-sm">Midday data column</div>
        {(Object.keys(mappableFields) as (keyof typeof mappableFields)[]).map((field) => (
          <FieldRow key={field} field={field} isStreaming={isStreaming} currency={watch("currency")} />
        ))}
      </div>

      <div className="w-full mt-6 border-t border-border pt-4">
        <div className="flex flex-col gap-4">
          <Controller
            control={control}
            name="inverted"
            render={({ field: { onChange, value } }) => (
              <div className="space-y-1">
                <Label htmlFor="inverted">Inverted amount</Label>
                <p className="text-sm text-[#606060]">If the transactions are from credit account, you can invert the amount.</p>
                <div className="flex justify-end">
                  <Switch id="inverted" checked={value} onCheckedChange={onChange} />
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <div className="mt-6">
        <Label className="mb-2 block">Account</Label>
        <Controller
          control={control}
          name="bank_account_id"
          render={({ field: { value, onChange } }) => (
            <SelectAccount
              className="w-full"
              placeholder="Select account"
              value={value}
              onChange={(account) => {
                onChange(account.id);
                if (account?.currency) {
                  setValue("currency", account.currency, { shouldValidate: true });
                  setShowCurrency(false);
                } else {
                  setShowCurrency(true);
                }
              }}
            />
          )}
        />
      </div>

      {showCurrency && (
        <>
          <Label className="mb-2 mt-4 block">Currency</Label>
          <Controller
            control={control}
            name="currency"
            render={({ field: { onChange, value } }) => (
              <SelectCurrency className="w-full text-xs" value={value} onChange={onChange} currencies={currencies} />
            )}
          />
        </>
      )}
    </div>
  );
}

function FieldRow({ field, isStreaming, currency }: { field: keyof typeof mappableFields; isStreaming: boolean; currency?: string }) {
  const { label, required } = mappableFields[field];
  const { control, watch, fileColumns, firstRows } = useCsvContext();
  const { data: user } = useUserQuery();
  const value = watch(field);
  const inverted = watch("inverted");
  const loading = isStreaming && !value;
  const firstRow = firstRows?.at(0);
  const description = firstRow?.[value as keyof typeof firstRow];

  const formatDescription = (desc?: string) => {
    if (!desc) return undefined;
    if (field === "date") return formatDate(desc);
    if (field === "amount") {
      const amount = formatAmountValue({ amount: desc, inverted });
      return currency ? formatAmount({ currency, amount, locale: user?.locale }) : amount;
    }
    if (field === "balance") {
      const amount = formatAmountValue({ amount: desc });
      const bal = +(amount * -1);
      return currency ? formatAmount({ currency, amount: bal, locale: user?.locale }) : bal;
    }
    if (field === "description") return capitalCase(desc);
    return desc;
  };

  return (
    <>
      <div className="relative flex min-w-0 items-center gap-2">
        <Controller
          control={control}
          name={field}
          rules={{ required }}
          render={({ field }) => (
            <Select value={field?.value ?? undefined} onValueChange={field.onChange}>
              <SelectTrigger className="w-full relative" hideIcon={loading as any}>
                <SelectValue placeholder={`Select ${label}`} />
                {loading && (
                  <div className="absolute top-2 right-2">
                    <Spinner />
                  </div>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{label}</SelectLabel>
                  {[...(fileColumns?.filter((c) => c !== "") || []), ...(field.value && !required ? ["None"] : [])].map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        <div className="flex items-center justify-end">
          <Icons.ArrowRightAlt className="size-4 text-[#878787]" />
        </div>
      </div>

      <span className="flex h-9 w-full items-center justify-between whitespace-nowrap border border-border bg-transparent px-3 py-2 text-sm">
        <div className="grow whitespace-nowrap text-sm font-normal text-muted-foreground justify-between flex">
          <span>{label}</span>
          {description && (
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger>
                  <Icons.Info />
                </TooltipTrigger>
                <TooltipContent className="p-2 text-xs">{String(formatDescription(description))}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </span>
    </>
  );
}
