import {
  sendInvoiceNow
} from "../../../../../../chunk-FDRZLFW2.mjs";
import {
  triggerBatch
} from "../../../../../../chunk-47TV3JZO.mjs";
import {
  createJobSupabaseClient
} from "../../../../../../chunk-MXJZGXJH.mjs";
import {
  schedules_exports
} from "../../../../../../chunk-VWLV5ODT.mjs";
import "../../../../../../chunk-RW5GJMRM.mjs";
import "../../../../../../chunk-NQV3D5OV.mjs";
import "../../../../../../chunk-NLZ3UE6W.mjs";
import "../../../../../../chunk-PMNONSNB.mjs";
import {
  __name,
  init_esm
} from "../../../../../../chunk-FHYA7B3S.mjs";

// src/tasks/invoice/scheduler/invoice-scheduled-send.ts
init_esm();
var invoiceScheduledSend = schedules_exports.task({
  id: "invoice-scheduled-send",
  cron: "*/10 * * * *",
  // every 10 minutes
  run: /* @__PURE__ */ __name(async () => {
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;
    const supabase = createJobSupabaseClient();
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const { data: invoices } = await supabase.from("invoices").select("id").eq("status", "draft").lte("scheduled_send_at", nowIso).limit(1e3);
    if (!invoices || invoices.length === 0) return;
    await triggerBatch(
      invoices.map((i) => ({ invoiceId: i.id })),
      sendInvoiceNow
    );
  }, "run")
});
export {
  invoiceScheduledSend
};
//# sourceMappingURL=invoice-scheduled-send.mjs.map
