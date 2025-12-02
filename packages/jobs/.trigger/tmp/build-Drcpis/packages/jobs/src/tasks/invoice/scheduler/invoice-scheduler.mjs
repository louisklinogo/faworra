import {
  checkInvoiceStatus
} from "../../../../../../chunk-FV25YPOJ.mjs";
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

// src/tasks/invoice/scheduler/invoice-scheduler.ts
init_esm();
var invoiceScheduler = schedules_exports.task({
  id: "invoice-scheduler",
  cron: "0 0,12 * * *",
  run: /* @__PURE__ */ __name(async () => {
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;
    const supabase = createJobSupabaseClient();
    const { data: invoices } = await supabase.from("invoices").select("id").in("status", ["sent", "overdue"]);
    if (!invoices || invoices.length === 0) return;
    await triggerBatch(
      invoices.map((i) => ({ invoiceId: i.id })),
      checkInvoiceStatus
    );
  }, "run")
});
export {
  invoiceScheduler
};
//# sourceMappingURL=invoice-scheduler.mjs.map
