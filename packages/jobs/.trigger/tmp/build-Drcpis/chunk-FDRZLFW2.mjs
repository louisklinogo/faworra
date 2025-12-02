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

// src/tasks/invoice/operations/send-invoice.ts
init_esm();
var sendInvoiceNow = schemaTask({
  id: "send-invoice-now",
  schema: external_exports.object({ invoiceId: external_exports.string().uuid() }),
  queue: { concurrencyLimit: 10 },
  run: /* @__PURE__ */ __name(async ({ invoiceId }) => {
    const supabase = createJobSupabaseClient();
    const { data: row } = await supabase.from("invoices").select(
      "id, team_id, invoice_number, amount, currency, invoice_url, template, order:orders!invoices_order_id_fkey(id, client:clients!orders_client_id_fkey(name, whatsapp))"
    ).eq("id", invoiceId).maybeSingle();
    await supabase.from("invoices").update({ status: "sent", sent_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", invoiceId);
    if (!row) return;
    const tpl = row.template || {};
    const includePdf = Boolean(tpl.includePdf);
    const sendCopy = Boolean(tpl.sendCopy);
    const whatsapp = row.order?.client?.whatsapp;
    const account = await supabase.from("communication_accounts").select("id").eq("team_id", row.team_id).ilike("provider", "whatsapp%").eq("status", "connected").limit(1).maybeSingle();
    const sendTo = /* @__PURE__ */ __name(async (to) => {
      const amount = Number(row.amount || 0).toLocaleString();
      const currency = String(row.currency || "GHS");
      const link = row.invoice_url ? `
View: ${row.invoice_url}` : "";
      const pdfNote = includePdf && row.invoice_url ? "\n(PDF available via link)" : "";
      const content = `Invoice ${row.invoice_number}
Amount: ${currency} ${amount}${link}${pdfNote}`;
      if (account.data?.id) {
        await supabase.from("communication_outbox").insert({
          team_id: row.team_id,
          account_id: account.data.id,
          recipient: to,
          content,
          status: "queued"
        });
      }
    }, "sendTo");
    if (whatsapp) await sendTo(whatsapp);
    if (sendCopy) {
      const copyTo = process.env.INVOICE_SEND_COPY_WHATSAPP || process.env.NOTIFY_WHATSAPP;
      if (copyTo) await sendTo(copyTo);
    }
  }, "run")
});

export {
  sendInvoiceNow
};
//# sourceMappingURL=chunk-FDRZLFW2.mjs.map
