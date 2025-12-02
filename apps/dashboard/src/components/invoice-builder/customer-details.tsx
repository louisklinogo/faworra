"use client";

import { Editor } from "@/components/invoice/editor";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { transformCustomerToContent } from "@midday/invoice/utils";
import type { JSONContent } from "@tiptap/react";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SelectCustomer } from "../select-customer";
import { LabelInput } from "./label-input";

export function CustomerDetails() {
  const { control, setValue, watch } = useFormContext();
  const { setParams, selectedCustomerId } = useInvoiceParams();

  const trpc = useTRPC();
  const updateTemplateMutation = trpc.invoiceTemplates.upsert.useMutation();
  const persistTemplate = (partial: Record<string, unknown>) =>
    updateTemplateMutation.mutate({ template: partial });

  const content = watch("customerDetails");
  const id = watch("id");

  const { data: customer } = trpc.clients.byId.useQuery(
    { id: selectedCustomerId! },
    {
      enabled: Boolean(selectedCustomerId),
    },
  );

  const handleLabelSave = (value: string) => {
    persistTemplate({ customerLabel: value });
  };

  const handleOnChange = (newContent?: JSONContent | null) => {
    setParams({ selectedCustomerId: null });

    setValue("customerDetails", newContent, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (!newContent) {
      setValue("customerName", null, { shouldValidate: true, shouldDirty: true });
      setValue("customerId", null, { shouldValidate: true, shouldDirty: true });
    }
  };

  useEffect(() => {
    if (!customer) return;

    const customerContent = transformCustomerToContent({
      name: customer.name ?? undefined,
      addressLine1: customer.address ?? undefined,
      email: customer.email ?? undefined,
      phone: customer.phone ?? customer.whatsapp ?? undefined,
      country: customer.country ?? undefined,
    });

    setParams({ selectedCustomerId: null });

    setValue("customerName", customer.name ?? null, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("customerId", customer.id ?? null, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("customerDetails", customerContent as JSONContent | null, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [customer, setParams, setValue]);

  return (
    <div>
      <LabelInput
        name="template.customerLabel"
        className="mb-2 block"
        onSave={handleLabelSave}
      />
      {content ? (
        <Controller
          name="customerDetails"
          control={control}
          render={({ field }) => (
            <Editor
              key={id}
              initialContent={field.value}
              onChange={handleOnChange}
              className="min-h-[90px]"
            />
          )}
        />
      ) : (
        <SelectCustomer />
      )}
    </div>
  );
}
