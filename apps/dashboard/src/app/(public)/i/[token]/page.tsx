import { CustomerHeader } from "@/components/invoice-public/customer-header";
import { InvoiceToolbar } from "@/components/invoice-public/invoice-toolbar";
import { getQueryClient, trpc } from "@/lib/trpc/server";
import { HtmlTemplate } from "@midday/invoice/templates/html";
import type { Invoice } from "@midday/invoice/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ token: string }>;
};

const widthForSize = (size: string | undefined) =>
  size === "letter" ? 750 : 595;

const heightForSize = (size: string | undefined) =>
  size === "letter" ? 1056 : 842;

const buildInvoicePayload = (data: any): Invoice => {
  const invoiceRecord = data.invoice as Record<string, any>;

  const lineItems = (data.items ?? []).map((item: any) => ({
    name: item.name ?? "",
    quantity: Number(item.quantity ?? 0),
    price: Number(item.unitPrice ?? item.price ?? 0),
    unit: item.unit ?? undefined,
  }));

  return {
    ...invoiceRecord,
    lineItems,
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
    customer: data.client
      ? {
          name: data.client.name,
          website: data.client.website,
          email: data.client.email,
        }
      : invoiceRecord.customer ?? null,
    team: data.team ?? invoiceRecord.team ?? null,
  } as Invoice;
};

export async function generateMetadata(props: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const params = await props.params;
  const queryClient = getQueryClient();

  try {
    const data = await queryClient.fetchQuery(
      trpc.invoices.getByToken.queryOptions({ token: params.token }),
    );

    if (!data?.invoice) {
      return {
        title: "Invoice Not Found",
        robots: { index: false, follow: false },
      };
    }

    const invoiceRecord = data.invoice as Record<string, any>;
    const title = `Invoice ${invoiceRecord.invoiceNumber ?? ""}`.trim();
    const description = `Invoice for ${
      invoiceRecord.customerName || data.client?.name || "Customer"
    }`;

    return {
      title,
      description,
      openGraph: { title, description },
      twitter: { card: "summary", title, description },
      robots: { index: false, follow: false },
    } satisfies Metadata;
  } catch {
    return {
      title: "Invoice Not Found",
      robots: { index: false, follow: false },
    } satisfies Metadata;
  }
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  const data = await queryClient.fetchQuery(
    trpc.invoices.getByToken.queryOptions({ token: params.token }),
  );

  if (!data?.invoice) {
    notFound();
  }

  const invoiceRecord = data.invoice as Record<string, any>;

  if (invoiceRecord.status === "draft") {
    notFound();
  }

  const invoice = buildInvoicePayload(data);

  const width = widthForSize(invoice.template.size);
  const height = heightForSize(invoice.template.size);
  const customerName = invoice.customerName || invoice.customer?.name || null;
  const customerWebsite = invoice.customer?.website || null;
  const poweredByHref = "https://faworra.com?utm_source=invoice";

  return (
    <div className="flex flex-col items-center min-h-screen dotted-bg p-4 sm:p-6 md:p-0">
      <div className="flex flex-col w-full max-w-full py-6" style={{ maxWidth: width }}>
        <CustomerHeader name={customerName} website={customerWebsite} status={invoiceRecord.status} />

        <div className="pb-24 md:pb-0">
          <div className="shadow-[0_24px_48px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]">
            <HtmlTemplate data={invoice} width={width} height={height} />
          </div>
        </div>
      </div>

      <InvoiceToolbar token={params.token} invoiceNumber={invoiceRecord.invoiceNumber || "invoice"} />

      <div className="fixed bottom-4 right-4 hidden md:block">
        <a
          href={poweredByHref}
          target="_blank"
          rel="noreferrer"
          className="text-[9px] text-[#878787]"
        >
          Powered by <span className="text-primary">Faworra</span>
        </a>
      </div>
    </div>
  );
}
