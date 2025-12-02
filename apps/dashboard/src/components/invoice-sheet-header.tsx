"use client";

import { mapInvoiceToForm } from "@/components/invoice-builder/adapters";
import { useTRPC } from "@/trpc/client";
import { SheetHeader } from "@midday/ui/sheet";
import { useMemo } from "react";

type Props = {
  invoiceId: string;
};

export function InvoiceSheetHeader({ invoiceId }: Props) {
  const trpc = useTRPC();

  const { data } = trpc.invoices.getWithItems.useQuery(
    { id: invoiceId },
    {
      enabled: Boolean(invoiceId),
    },
  );

  const invoice = useMemo(() => mapInvoiceToForm(data ?? null), [data]);

  if (invoice?.template?.deliveryType === "create_and_send") {
    return (
      <SheetHeader className="mb-6 flex flex-col">
        <h2 className="text-xl">Created & Sent</h2>
        <p className="text-sm text-[#808080]">
          Your invoice was created and sent successfully
        </p>
      </SheetHeader>
    );
  }

  if (invoice?.template?.deliveryType === "scheduled") {
    return (
      <SheetHeader className="mb-6 flex flex-col">
        <h2 className="text-xl">Scheduled</h2>
        <p className="text-sm text-[#808080]">
          Your invoice was scheduled successfully
        </p>
      </SheetHeader>
    );
  }

  // Default: created
  return (
    <SheetHeader className="mb-6 flex flex-col">
      <h2 className="text-xl">Created</h2>
      <p className="text-sm text-[#808080]">
        Your invoice was created successfully
      </p>
    </SheetHeader>
  );
}
