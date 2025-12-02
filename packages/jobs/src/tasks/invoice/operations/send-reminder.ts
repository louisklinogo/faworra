import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { createJobSupabaseClient } from "../../../clients/supabase";

export const sendInvoiceReminder = schemaTask({
  id: "send-invoice-reminder",
  schema: z.object({
    invoiceId: z.string().uuid(),
  }),
  queue: { concurrencyLimit: 10 },
  run: async ({ invoiceId }) => {
    const supabase = createJobSupabaseClient();

    // Fetch invoice with order and client
    const { data: row } = await supabase
      .from("invoices")
      .select(
        "id, team_id, invoice_number, amount, currency, due_date, reminder_count, last_reminded_at, template, order:orders!invoices_order_id_fkey(id, client:clients!orders_client_id_fkey(name, whatsapp))",
      )
      .eq("id", invoiceId)
      .maybeSingle();
    if (!row) return;

    const whatsapp = (row as any).order?.client?.whatsapp as string | undefined;
    if (!whatsapp) return; // No recipient

    // Pick a WhatsApp account for team
    const { data: account } = await supabase
      .from("communication_accounts")
      .select("id")
      .eq("team_id", row.team_id)
      .ilike("provider", "whatsapp%")
      .eq("status", "connected")
      .limit(1)
      .maybeSingle();
    if (!account) return;

    const due = row.due_date ? new Date(row.due_date) : null;
    const dueStr = due
      ? due.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "soon";
    const amount = Number(row.amount || 0).toLocaleString();
    const currency = String(row.currency || "GHS");
    const message = `Reminder: Invoice ${row.invoice_number} is due ${dueStr}. Amount: ${currency} ${amount}.`;

    // Enqueue WhatsApp message via outbox
    await supabase.from("communication_outbox").insert({
      team_id: row.team_id,
      account_id: account.id,
      recipient: whatsapp,
      content: message,
      status: "queued",
    });

    // Optional copy
    const tpl = (row.template as any) || {};
    if (tpl.sendCopy) {
      const copyTo = process.env.INVOICE_SEND_COPY_WHATSAPP || process.env.NOTIFY_WHATSAPP;
      if (copyTo) {
        await supabase.from("communication_outbox").insert({
          team_id: row.team_id,
          account_id: account.id,
          recipient: copyTo,
          content: `[COPY] ${message}`,
          status: "queued",
        });
      }
    }

    // Update reminder counters
    const now = new Date().toISOString();
    await supabase
      .from("invoices")
      .update({
        reminder_count: (row.reminder_count ?? 0) + 1,
        last_reminded_at: now,
      })
      .eq("id", invoiceId);
  },
});
