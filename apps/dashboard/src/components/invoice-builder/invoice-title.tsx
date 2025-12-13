"use client";

import { useTRPC } from "@/trpc/client";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";

export function InvoiceTitle() {
  const { watch } = useFormContext();
  const invoiceTitle = watch("template.title");

  const trpc = useTRPC();
  const updateTemplateMutation = trpc.invoiceTemplates.upsert.useMutation();

  return (
    <Input
      className="text-[21px] font-medium mb-2 w-fit min-w-[100px] !border-none"
      name="template.title"
      onBlur={() => {
        updateTemplateMutation.mutate({
          template: { title: invoiceTitle },
        });
      }}
    />
  );
}
