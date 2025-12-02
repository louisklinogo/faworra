import {
  sendInvoiceReminder
} from "../../../../../../chunk-RLH75ZEB.mjs";
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

// src/tasks/invoice/scheduler/invoice-reminders-scheduler.ts
init_esm();
var invoiceRemindersScheduler = schedules_exports.task({
  id: "invoice-reminders-scheduler",
  cron: "0 9,15 * * *",
  // twice a day
  run: /* @__PURE__ */ __name(async () => {
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;
    const supabase = createJobSupabaseClient();
    const { data: invoices } = await supabase.from("invoices").select("id, due_date, status, last_reminded_at, reminder_count").in("status", ["sent", "partially_paid"]).is("deleted_at", null).limit(1e3);
    if (!invoices || invoices.length === 0) return;
    const now = /* @__PURE__ */ new Date();
    const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1e3);
    const shouldRemind = /* @__PURE__ */ __name((inv) => {
      if (!inv.due_date) return false;
      const due = new Date(inv.due_date);
      const overdue = due < now;
      const nearDue = due >= now && due <= inTwoDays;
      const count = Number(inv.reminder_count ?? 0);
      if (count >= 3) return false;
      const last = inv.last_reminded_at ? new Date(inv.last_reminded_at) : null;
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
      const spacingOk = !last || last < oneDayAgo;
      return (overdue || nearDue) && spacingOk;
    }, "shouldRemind");
    const targets = invoices.filter(shouldRemind).map((i) => ({ invoiceId: i.id }));
    if (targets.length === 0) return;
    await triggerBatch(targets, sendInvoiceReminder);
  }, "run")
});
export {
  invoiceRemindersScheduler
};
//# sourceMappingURL=invoice-reminders-scheduler.mjs.map
