import type { RouterInputs, RouterOutputs } from "@api/trpc/routers/_app";
import { calculateLineItemTotal } from "@midday/invoice/calculate";
import type { InvoiceFormValues } from "./form-context";

const DEFAULT_TEMPLATE: InvoiceFormValues["template"] = {
  title: "Invoice",
  customerLabel: "Bill To",
  fromLabel: "From",
  invoiceNoLabel: "Invoice #",
  issueDateLabel: "Issue Date",
  dueDateLabel: "Due Date",
  descriptionLabel: "Description",
  priceLabel: "Price",
  quantityLabel: "Qty",
  totalLabel: "Total",
  paymentLabel: "Payment Details",
  noteLabel: "Notes",
  currency: "GHS",
  size: "a4",
  includeVat: false,
  includeTax: false,
  includeDiscount: false,
  includeDecimals: true,
  includePdf: true,
  includeUnits: false,
  includeQr: false,
  taxRate: 0,
  vatRate: 0,
  dateFormat: "dd/MM/yyyy",
  deliveryType: "create",
  paymentDetails: null,
  fromDetails: null,
  logoUrl: null,
  subtotalLabel: "Subtotal",
  taxLabel: "Tax",
  discountLabel: "Discount",
  totalSummaryLabel: "Total",
  vatLabel: "VAT",
  locale: "en-US",
  timezone: "UTC",
};

const ensureArray = <T>(value: T[] | undefined | null, fallback: T): T[] => {
  if (!value || value.length === 0) {
    return [fallback];
  }

  return value;
};

const mergeTemplate = (
  template?: Partial<InvoiceFormValues["template"]> | null,
): InvoiceFormValues["template"] => ({
  ...DEFAULT_TEMPLATE,
  ...template,
  includeVat: template?.includeVat ?? DEFAULT_TEMPLATE.includeVat,
  includeTax: template?.includeTax ?? DEFAULT_TEMPLATE.includeTax,
  includeDiscount: template?.includeDiscount ?? DEFAULT_TEMPLATE.includeDiscount,
  includeDecimals: template?.includeDecimals ?? DEFAULT_TEMPLATE.includeDecimals,
  includePdf: template?.includePdf ?? DEFAULT_TEMPLATE.includePdf,
  includeUnits: template?.includeUnits ?? DEFAULT_TEMPLATE.includeUnits,
  includeQr: template?.includeQr ?? DEFAULT_TEMPLATE.includeQr,
  taxRate: template?.taxRate ?? DEFAULT_TEMPLATE.taxRate,
  vatRate: template?.vatRate ?? DEFAULT_TEMPLATE.vatRate,
  paymentDetails: template?.paymentDetails ?? DEFAULT_TEMPLATE.paymentDetails,
  fromDetails: template?.fromDetails ?? DEFAULT_TEMPLATE.fromDetails,
  logoUrl: template?.logoUrl ?? DEFAULT_TEMPLATE.logoUrl,
  locale: template?.locale ?? DEFAULT_TEMPLATE.locale,
  timezone: template?.timezone ?? DEFAULT_TEMPLATE.timezone,
  currency: template?.currency ?? DEFAULT_TEMPLATE.currency,
  deliveryType: template?.deliveryType ?? DEFAULT_TEMPLATE.deliveryType,
  subtotalLabel: template?.subtotalLabel ?? DEFAULT_TEMPLATE.subtotalLabel,
  taxLabel: template?.taxLabel ?? DEFAULT_TEMPLATE.taxLabel,
  discountLabel: template?.discountLabel ?? DEFAULT_TEMPLATE.discountLabel,
  totalSummaryLabel: template?.totalSummaryLabel ?? DEFAULT_TEMPLATE.totalSummaryLabel,
  vatLabel: template?.vatLabel ?? DEFAULT_TEMPLATE.vatLabel,
});

const toISOString = (value: string | null | undefined) => {
  if (!value) return undefined;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
};

const mapLineItems = (
  items: InvoiceFormValues["lineItems"],
): NonNullable<RouterInputs["invoices"]["updateDraft"]["items"]> =>
  items.map((item) => {
    const quantity = Number.isFinite(item.quantity) ? Number(item.quantity) : 0;
    const unitPrice = Number.isFinite(item.price) ? Number(item.price) : 0;

    return {
      name: item.name,
      quantity,
      unitPrice,
      total: calculateLineItemTotal({ price: unitPrice, quantity }),
      orderItemId: undefined,
    };
  });

const sanitize = <T>(value: T | null | undefined) => (value == null ? undefined : value);

export const mapDefaultSettingsToForm = (
  defaults: RouterOutputs["invoices"]["defaultSettings"],
): InvoiceFormValues => {
  const defaultsAny = defaults as Record<string, any>;
  const template = mergeTemplate(defaults.template as any);
  const lineItems = ensureArray(
    defaults.items?.map((item: any) => ({
      name: item.name ?? "",
      quantity: Number(item.quantity ?? 0),
      price: Number(item.unitPrice ?? item.price ?? 0),
      unit: item.unit ?? undefined,
      vat: item.vat ?? 0,
      tax: item.tax ?? 0,
    })),
    {
      name: "",
      quantity: 0,
      price: 0,
      unit: undefined,
      vat: 0,
      tax: 0,
    },
  );

  return {
    id: crypto.randomUUID(),
    status: defaults.status ?? "draft",
    template,
    fromDetails: sanitize(defaultsAny.fromDetails) ?? null,
    customerDetails: sanitize(defaultsAny.customerDetails) ?? null,
    customerId: defaults.clientId ?? null,
    customerName: defaults.clientName ?? undefined,
    paymentDetails: sanitize(defaultsAny.paymentDetails) ?? null,
    noteDetails: sanitize(defaultsAny.noteDetails) ?? null,
    dueDate: defaultsAny.dueDate ?? null,
    issueDate: defaultsAny.issueDate ?? null,
    invoiceNumber: defaults.invoiceNumber,
    logoUrl: template.logoUrl ?? null,
    vat: template.vatRate ?? null,
    tax: Number(defaults.tax ?? 0),
    discount: Number(defaults.discount ?? 0),
    subtotal: Number(defaults.subtotal ?? 0),
    topBlock: sanitize(defaultsAny.topBlock) ?? null,
    bottomBlock: sanitize(defaultsAny.bottomBlock) ?? null,
    amount: Number(defaults.amount ?? defaults.subtotal ?? 0),
    lineItems,
    token: undefined,
    scheduledAt: defaultsAny.scheduledSendAt ?? null,
    orderId: defaults.orderId ?? null,
    sentTo: null,
  } as InvoiceFormValues;
};

export const mapInvoiceToForm = (
  invoiceData: RouterOutputs["invoices"]["getWithItems"] | null,
): InvoiceFormValues | undefined => {
  if (!invoiceData?.invoice) return undefined;

  const invoice = invoiceData.invoice as Record<string, any>;
  const template = mergeTemplate(invoice.template as any);

  const lineItems = ensureArray(
    invoiceData.items?.map((item: any) => ({
      name: item.name ?? "",
      quantity: Number(item.quantity ?? 0),
      price: Number(item.unitPrice ?? 0),
      unit: item.unit ?? undefined,
      vat: item.vat ?? 0,
      tax: item.tax ?? 0,
    })),
    {
      name: "",
      quantity: 0,
      price: 0,
      unit: undefined,
      vat: 0,
      tax: 0,
    },
  );

  return {
    id: invoice.id,
    status: invoice.status ?? "draft",
    template,
    fromDetails: sanitize(invoice.fromDetails) ?? null,
    customerDetails: sanitize(invoice.customerDetails) ?? null,
    customerId: invoice.customerDetails?.id ?? invoiceData.client?.id ?? null,
    customerName:
      invoice.customerDetails?.name ?? invoiceData.client?.name ?? invoice.customerName ?? undefined,
    paymentDetails: sanitize(invoice.paymentDetails) ?? null,
    noteDetails: sanitize(invoice.noteDetails) ?? null,
    dueDate: invoice.dueDate ?? null,
    issueDate: invoice.issueDate ?? null,
    invoiceNumber: invoice.invoiceNumber,
    logoUrl: template.logoUrl ?? null,
    vat: invoice.vatAmount ? Number(invoice.vatAmount) : template.vatRate ?? null,
    tax: invoice.tax ? Number(invoice.tax) : 0,
    discount: invoice.discount ? Number(invoice.discount) : 0,
    subtotal: invoice.subtotal ? Number(invoice.subtotal) : 0,
    topBlock: sanitize(invoice.topBlock) ?? null,
    bottomBlock: sanitize(invoice.bottomBlock) ?? null,
    amount: invoice.amount ? Number(invoice.amount) : 0,
    lineItems,
    token: invoice.token ?? undefined,
    scheduledAt: invoice.scheduledSendAt ?? null,
    orderId: invoice.orderId ?? null,
    sentTo: invoice.sentTo ?? invoice.customerEmail ?? null,
  } as InvoiceFormValues;
};

export const mapFormValuesToDraftInput = (
  values: InvoiceFormValues,
): RouterInputs["invoices"]["updateDraft"] => ({
  id: values.id,
  subtotal: Number(values.subtotal ?? 0),
  tax: Number(values.tax ?? 0),
  discount: Number(values.discount ?? 0),
  amount: Number(values.amount ?? 0),
  dueDate: values.dueDate ? toISOString(values.dueDate) ?? null : null,
  scheduledSendAt: toISOString(values.scheduledAt ?? undefined),
  issueDate: toISOString(values.issueDate ?? undefined),
  template: values.template as Record<string, any>,
  fromDetails: sanitize(values.fromDetails),
  customerDetails: sanitize(values.customerDetails),
  paymentDetails: sanitize(values.paymentDetails),
  noteDetails: sanitize(values.noteDetails),
  topBlock: sanitize(values.topBlock),
  bottomBlock: sanitize(values.bottomBlock),
  items: mapLineItems(values.lineItems),
});

export const mapFormValuesToCreateInput = (
  values: InvoiceFormValues,
): RouterInputs["invoices"]["create"] => ({
  orderId: values.orderId ?? null,
  invoiceNumber: values.invoiceNumber,
  subtotal: Number(values.subtotal ?? 0),
  tax: Number(values.tax ?? 0),
  discount: Number(values.discount ?? 0),
  amount: Number(values.amount ?? 0),
  status: (values.status as RouterInputs["invoices"]["create"]["status"]) ?? "draft",
  dueDate: values.dueDate ? toISOString(values.dueDate) ?? null : null,
  scheduledSendAt: toISOString(values.scheduledAt ?? undefined),
  notes: undefined,
  issueDate: toISOString(values.issueDate ?? undefined),
  template: values.template as Record<string, any>,
  fromDetails: sanitize(values.fromDetails),
  customerDetails: sanitize(values.customerDetails),
  paymentDetails: sanitize(values.paymentDetails),
  noteDetails: sanitize(values.noteDetails),
  topBlock: sanitize(values.topBlock),
  bottomBlock: sanitize(values.bottomBlock),
  items: mapLineItems(values.lineItems),
});
