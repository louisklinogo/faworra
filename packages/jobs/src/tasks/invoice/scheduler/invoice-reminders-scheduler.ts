import { schedules } from "@trigger.dev/sdk/v3";
import { createJobSupabaseClient } from "../../../clients/supabase";
import { triggerBatch } from "../../../utils/trigger-batch";
import { sendInvoiceReminder } from "../operations/send-reminder";

export const invoiceRemindersScheduler = schedules.task({
  id: "invoice-reminders-scheduler",
  cron: "0 9,15 * * *", // twice a day
  run: async () => {
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const supabase = createJobSupabaseClient();
    // Fetch candidates: sent or partial
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, due_date, status, last_reminded_at, reminder_count")
      .in("status", ["sent", "partially_paid"]) // candidates for reminders
      .is("deleted_at", null)
      .limit(1000);

    if (!invoices || invoices.length === 0) return;

    const now = new Date();
    const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const shouldRemind = (inv: any) => {
      if (!inv.due_date) return false;
      const due = new Date(inv.due_date);
      const overdue = due < now;
      const nearDue = due >= now && due <= inTwoDays;
      const count = Number(inv.reminder_count ?? 0);
      if (count >= 3) return false; // max 3 reminders
      const last = inv.last_reminded_at ? new Date(inv.last_reminded_at) : null;
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const spacingOk = !last || last < oneDayAgo;
      return (overdue || nearDue) && spacingOk;
    };

    const targets = invoices.filter(shouldRemind).map((i) => ({ invoiceId: i.id }));
    if (targets.length === 0) return;

    await triggerBatch(targets, sendInvoiceReminder);
  },
});
