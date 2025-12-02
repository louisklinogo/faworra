import { schedules } from "@trigger.dev/sdk/v3";
import { createJobSupabaseClient } from "../../../clients/supabase";
import { triggerBatch } from "../../../utils/trigger-batch";
import { sendInvoiceNow } from "../operations/send-invoice";

export const invoiceScheduledSend = schedules.task({
  id: "invoice-scheduled-send",
  cron: "*/10 * * * *", // every 10 minutes
  run: async () => {
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const supabase = createJobSupabaseClient();
    const nowIso = new Date().toISOString();
    // Fetch drafts that should be sent now
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id")
      .eq("status", "draft")
      .lte("scheduled_send_at", nowIso)
      .limit(1000);

    if (!invoices || invoices.length === 0) return;

    await triggerBatch(
      invoices.map((i) => ({ invoiceId: i.id })),
      sendInvoiceNow,
    );
  },
});
