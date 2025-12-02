import { getInvoicesWithOrder } from "@Faworra/database/queries";
import { redirect } from "next/navigation";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { InvoicesClient } from "./_components/invoices-client";
import { InvoicesOverview } from "./_components/invoices-overview";
import type { InvoiceWithOrder } from "@/lib/supabase-queries";

export default async function InvoicesPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");

  // ✅ CORRECT: Direct DB query in Server Component
  const rows = await getInvoicesWithOrder(db, { teamId, limit: 50 });

  // Map DB rows (camelCase) to UI shape (snake_case) expected by InvoicesTable
  const invoices = rows.map((r: any) => ({
    id: r.invoice.id,
    invoice_number: r.invoice.invoiceNumber,
    order_id: r.invoice.orderId,
    amount: Number(r.invoice.amount ?? 0),
    status: String(r.invoice.status),
    pdf_url: r.invoice.invoiceUrl ?? null,
    issued_at: (r.invoice.createdAt || r.invoice.sentAt || r.invoice.createdAt)?.toISOString?.() ?? r.invoice.createdAt,
    due_at: r.invoice.dueDate ? new Date(r.invoice.dueDate).toISOString() : null,
    paid_at: r.invoice.paidAt ? new Date(r.invoice.paidAt).toISOString() : null,
    created_at: r.invoice.createdAt ? new Date(r.invoice.createdAt).toISOString() : new Date().toISOString(),
    updated_at: r.invoice.updatedAt ? new Date(r.invoice.updatedAt).toISOString() : new Date().toISOString(),
    order: r.order
      ? ({
          order_number: r.order.orderNumber,
          client: r.client ? { name: r.client.name } : undefined,
        } as any)
      : undefined,
  })) as unknown as InvoiceWithOrder[];

  return (
    <div className="flex flex-col gap-6">
      <InvoicesOverview />
      <InvoicesClient invoices={invoices} />
    </div>
  );
}
