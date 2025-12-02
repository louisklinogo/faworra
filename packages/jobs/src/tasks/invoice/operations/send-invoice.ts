import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { createJobSupabaseClient } from "../../../clients/supabase";

export const sendInvoiceNow = schemaTask({
  id: "send-invoice-now",
  schema: z.object({ invoiceId: z.string().uuid() }),
  queue: { concurrencyLimit: 10 },
  run: async ({ invoiceId }) => {
    const supabase = createJobSupabaseClient();

    // Fetch invoice + order/client + template flags
    const { data: row } = await supabase
      .from("invoices")
      .select(
        "id, team_id, invoice_number, amount, currency, invoice_url, template, order:orders!invoices_order_id_fkey(id, client:clients!orders_client_id_fkey(name, whatsapp))",
      )
      .eq("id", invoiceId)
      .maybeSingle();

    // Transition to sent
    await supabase
      .from("invoices")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", invoiceId);

    if (!row) return;

    const tpl = ((row as any).template as any) || {};
    const includePdf: boolean = Boolean(tpl.includePdf);
    const sendCopy: boolean = Boolean(tpl.sendCopy);

    // Resolve recipient (WhatsApp)
    const whatsapp = (row as any).order?.client?.whatsapp as string | undefined;
    const account = await supabase
      .from("communication_accounts")
      .select("id")
      .eq("team_id", row.team_id)
      .ilike("provider", "whatsapp%")
      .eq("status", "connected")
      .limit(1)
      .maybeSingle();

    const sendTo = async (to: string) => {
      const amount = Number(row.amount || 0).toLocaleString();
      const currency = String(row.currency || "GHS");
      const link = row.invoice_url ? `\nView: ${row.invoice_url}` : "";
      const pdfNote = includePdf && row.invoice_url ? "\n(PDF available via link)" : "";
      const content = `Invoice ${row.invoice_number}\nAmount: ${currency} ${amount}${link}${pdfNote}`;
      if (account.data?.id) {
        await supabase.from("communication_outbox").insert({
          team_id: row.team_id,
          account_id: account.data.id,
          recipient: to,
          content,
          status: "queued",
        });
      }
    };

    if (whatsapp) await sendTo(whatsapp);
    if (sendCopy) {
      const copyTo = process.env.INVOICE_SEND_COPY_WHATSAPP || process.env.NOTIFY_WHATSAPP;
      if (copyTo) await sendTo(copyTo);
    }
  },
});
