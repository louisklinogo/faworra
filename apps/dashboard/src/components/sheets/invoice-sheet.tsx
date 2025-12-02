"use client";

import { InvoiceContent } from "@/components/invoice-content";
import { mapDefaultSettingsToForm, mapInvoiceToForm } from "@/components/invoice-builder/adapters";
import { FormContext } from "@/components/invoice/form-context";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { Sheet } from "@midday/ui/sheet";
import React, { useMemo } from "react";

export function InvoiceSheet() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();
  const { setParams, type, invoiceId, orderId } = useInvoiceParams();
  const isOpen = type === "create" || type === "edit" || type === "success";

  // Get default settings for new invoices
  const [defaultSettings] = trpc.invoices.defaultSettings.useSuspenseQuery(
    orderId ? { orderId } : undefined,
  );

  // Get draft invoice for edit
  const { data } = trpc.invoices.getWithItems.useQuery(
    { id: invoiceId! },
    {
      enabled: !!invoiceId,
      staleTime: 0,
    },
  );

  const defaultValues = useMemo(
    () => mapDefaultSettingsToForm(defaultSettings),
    [defaultSettings],
  );

  const invoiceValues = useMemo(
    () => mapInvoiceToForm(data ?? null),
    [data],
  );

  const handleOnOpenChange = (open: boolean) => {
    if (!open) {
      // Invalidate queries when closing the sheet to prevent stale data
      void utils.invoices.getWithItems.invalidate();
      void utils.invoices.defaultSettings.invalidate();
    }

    setParams(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOnOpenChange}>
      <FormContext defaultValues={defaultValues} invoiceValues={invoiceValues}>
        <InvoiceContent />
      </FormContext>
    </Sheet>
  );
}
