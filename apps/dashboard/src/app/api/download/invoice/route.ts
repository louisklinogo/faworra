import { getQueryClient, trpc } from "@/lib/trpc/server";
import type { Invoice, LineItem } from "@midday/invoice/types";
import { PdfTemplate, renderToStream } from "@midday/invoice";
import { type NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid().optional(),
  token: z.string().optional(),
  preview: z.union([z.literal("true"), z.literal("false")]).optional(),
});

function mapLineItems(items: any[]): LineItem[] {
  return items.map((item) => ({
    name: item.name ?? "",
    quantity: Number(item.quantity ?? 0),
    price: Number(item.unitPrice ?? item.price ?? 0),
    unit: item.unit ?? undefined,
  }));
}

function buildInvoicePayload(data: any) {
  if (!data?.invoice) return null;

  const invoiceRecord = data.invoice as Record<string, any>;
  const customer = data.client
    ? {
        name: data.client.name,
        website: data.client.website,
        email: data.client.email,
      }
    : invoiceRecord.customer ?? null;

  const invoicePayload = {
    ...invoiceRecord,
    lineItems: mapLineItems(data.items ?? []),
    paymentDetails: invoiceRecord.paymentDetails ?? null,
    customerDetails: invoiceRecord.customerDetails ?? null,
    noteDetails: invoiceRecord.noteDetails ?? null,
    topBlock: invoiceRecord.topBlock ?? null,
    bottomBlock: invoiceRecord.bottomBlock ?? null,
    discount: Number(invoiceRecord.discount ?? 0),
    tax: Number(invoiceRecord.tax ?? 0),
    vat: Number(invoiceRecord.vat ?? 0),
    amount: Number(invoiceRecord.amount ?? 0),
    currency: invoiceRecord.currency ?? invoiceRecord.template?.currency ?? "USD",
    customer,
    team: data.team ?? invoiceRecord.team ?? null,
    invoiceUrl: invoiceRecord.invoiceUrl ?? null,
  } as Invoice & { invoiceUrl?: string | null };

  return invoicePayload;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = schema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return new Response("Invalid parameters", { status: 400 });
  }

  const { id, token, preview } = parsed.data;

  if (!id && !token) {
    return new Response("Missing identifier", { status: 400 });
  }

  const queryClient = getQueryClient();
  const queryOptions = token
    ? trpc.invoices.getByToken.queryOptions({ token })
    : trpc.invoices.getWithItems.queryOptions({ id: id! });

  const data = await queryClient.fetchQuery(queryOptions as any);

  const invoice = buildInvoicePayload(data as any);

  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  const pdfStream = await renderToStream(await PdfTemplate(invoice));
  // @ts-expect-error renderToStream returns a Readable stream compatible with Response
  const blob = await new Response(pdfStream).blob();

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Cache-Control": "no-store, max-age=0",
  };

  if (preview !== "true") {
    headers["Content-Disposition"] = `attachment; filename="${invoice.invoiceNumber || "invoice"}.pdf"`;
  }

  return new Response(blob, { headers });
}
