"use client";

import { Editor } from "@/components/invoice/editor";
import { useTRPC } from "@/trpc/client";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");

  const trpc = useTRPC();
  const updateTemplateMutation = trpc.invoiceTemplates.upsert.useMutation();
  const persistTemplate = (partial: Record<string, unknown>) =>
    updateTemplateMutation.mutate({ template: partial });

  return (
    <div>
      <LabelInput
        name="template.paymentLabel"
        onSave={(value) => {
          persistTemplate({ paymentLabel: value });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="paymentDetails"
        render={({ field }) => (
          <Editor
            // NOTE: This is a workaround to get the new content to render
            key={id}
            initialContent={field.value}
            onChange={field.onChange}
            onBlur={(content) => {
              persistTemplate({
                paymentDetails: content ? JSON.stringify(content) : null,
              });
            }}
            className="min-h-[78px]"
          />
        )}
      />
    </div>
  );
}
