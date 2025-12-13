"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod";

export const invoiceTemplateSchema = z.object({
  title: z.string().optional(),
  customerLabel: z.string(),
  fromLabel: z.string(),
  invoiceNoLabel: z.string(),
  issueDateLabel: z.string(),
  dueDateLabel: z.string(),
  descriptionLabel: z.string(),
  priceLabel: z.string(),
  quantityLabel: z.string(),
  totalLabel: z.string(),
  totalSummaryLabel: z.string().optional(),
  vatLabel: z.string().optional(),
  subtotalLabel: z.string().optional(),
  taxLabel: z.string().optional(),
  discountLabel: z.string().optional(),
  paymentLabel: z.string(),
  noteLabel: z.string(),
  logoUrl: z.string().optional().nullable(),
  currency: z.string(),
  paymentDetails: z.any().nullable().optional(),
  fromDetails: z.any().nullable().optional(),
  size: z.enum(["a4", "letter"]),
  includeVat: z.boolean().optional(),
  includeTax: z.boolean().optional(),
  includeDiscount: z.boolean().optional(),
  includeDecimals: z.boolean().optional(),
  includePdf: z.boolean().optional(),
  includeUnits: z.boolean().optional(),
  includeQr: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"]),
  deliveryType: z.enum(["create", "create_and_send", "scheduled"]),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export const lineItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().min(0, "Quantity must be at least 0"),
  unit: z.string().optional(),
  price: z.number(),
  vat: z.number().min(0, "VAT must be at least 0").optional(),
  tax: z.number().min(0, "Tax must be at least 0").optional(),
});

export const invoiceFormSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  template: invoiceTemplateSchema,
  fromDetails: z.any().nullable().optional(),
  customerDetails: z.any().nullable().optional(),
  customerId: z
    .string()
    .uuid()
    .nullable()
    .optional(),
  customerName: z.string().optional(),
  paymentDetails: z.any().nullable().optional(),
  noteDetails: z.any().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  issueDate: z.string().nullable().optional(),
  invoiceNumber: z.string(),
  logoUrl: z.string().nullable().optional(),
  vat: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  topBlock: z.any().nullable().optional(),
  bottomBlock: z.any().nullable().optional(),
  amount: z.number().nullable().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  token: z.string().optional(),
  scheduledAt: z.string().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  sentTo: z.string().nullable().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

type FormContextProps = {
  children: React.ReactNode;
  defaultValues: InvoiceFormValues;
  invoiceValues?: InvoiceFormValues;
};

export function FormContext({
  children,
  defaultValues,
  invoiceValues,
}: FormContextProps) {
  const form = useZodForm(invoiceFormSchema, {
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      ...defaultValues,
      ...(invoiceValues ?? {}),
      template: {
        ...defaultValues.template,
        ...(invoiceValues?.template ?? {}),
      },
    });
  }, [defaultValues, invoiceValues, form]);

  return <FormProvider {...form}>{children}</FormProvider>;
}
