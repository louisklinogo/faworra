import {
  createJobSupabaseClient,
  external_exports
} from "./chunk-MXJZGXJH.mjs";
import {
  schemaTask
} from "./chunk-VWLV5ODT.mjs";
import {
  __name,
  init_esm
} from "./chunk-FHYA7B3S.mjs";

// src/tasks/invoice/operations/send-reminder.ts
init_esm();
var sendInvoiceReminder = schemaTask({
  id: "send-invoice-reminder",
  schema: external_exports.object({
    invoiceId: external_exports.string().uuid()
  }),
  queue: { concurrencyLimit: 10 },
  run: /* @__PURE__ */ __name(async ({ invoiceId }) => {
    const supabase = createJobSupabaseClient();
    const { data: row } = await supabase.from("invoices").select(
      "id, team_id, invoice_number, amount, currency, due_date, reminder_count, last_reminded_at, template, order:orders!invoices_order_id_fkey(id, client:clients!orders_client_id_fkey(name, whatsapp))"
    ).eq("id", invoiceId).maybeSingle();
    if (!row) return;
    const whatsapp = row.order?.client?.whatsapp;
    if (!whatsapp) return;
    const { data: account } = await supabase.from("communication_accounts").select("id").eq("team_id", row.team_id).ilike("provider", "whatsapp%").eq("status", "connected").limit(1).maybeSingle();
    if (!account) return;
    const due = row.due_date ? new Date(row.due_date) : null;
    const dueStr = due ? due.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "soon";
    const amount = Number(row.amount || 0).toLocaleString();
    const currency = String(row.currency || "GHS");
    const message = `Reminder: Invoice ${row.invoice_number} is due ${dueStr}. Amount: ${currency} ${amount}.`;
    await supabase.from("communication_outbox").insert({
      team_id: row.team_id,
      account_id: account.id,
      recipient: whatsapp,
      content: message,
      status: "queued"
    });
    const tpl = row.template || {};
    if (tpl.sendCopy) {
      const copyTo = process.env.INVOICE_SEND_COPY_WHATSAPP || process.env.NOTIFY_WHATSAPP;
      if (copyTo) {
        await supabase.from("communication_outbox").insert({
          team_id: row.team_id,
          account_id: account.id,
          recipient: copyTo,
          content: `[COPY] ${message}`,
          status: "queued"
        });
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await supabase.from("invoices").update({
      reminder_count: (row.reminder_count ?? 0) + 1,
      last_reminded_at: now
    }).eq("id", invoiceId);
  }, "run")
});

export {
  sendInvoiceReminder
};
//# sourceMappingURL=chunk-RLH75ZEB.mjs.map
