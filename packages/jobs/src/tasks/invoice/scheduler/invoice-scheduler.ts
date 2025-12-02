import { schedules } from "@trigger.dev/sdk/v3";
import { createJobSupabaseClient } from "../../../clients/supabase";
import { triggerBatch } from "../../../utils/trigger-batch";
import { checkInvoiceStatus } from "../operations/check-status";

export const invoiceScheduler = schedules.task({
  id: "invoice-scheduler",
  cron: "0 0,12 * * *",
  run: async () => {
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const supabase = createJobSupabaseClient();
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id")
      .in("status", ["sent", "overdue"]);
    if (!invoices || invoices.length === 0) return;

    await triggerBatch(
      invoices.map((i) => ({ invoiceId: i.id })),
      checkInvoiceStatus,
    );
  },
});
