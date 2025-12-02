import { subDays } from "date-fns";
import { z } from "zod";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { createJobSupabaseClient } from "../../../clients/supabase";
import { updateInvoiceStatus } from "../../../utils/update-invoice";

export const checkInvoiceStatus = schemaTask({
  id: "check-invoice-status",
  schema: z.object({
    invoiceId: z.string().uuid(),
  }),
  queue: { concurrencyLimit: 10 },
  run: async ({ invoiceId }) => {
    const supabase = createJobSupabaseClient();

    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, status, due_date, currency, amount, team_id, invoice_number")
      .eq("id", invoiceId)
      .maybeSingle();

    if (!invoice || !invoice.amount || !invoice.currency || !invoice.due_date) {
      return;
    }

    // Find recent transactions matching invoice amount, currency, and team_id
    const since = subDays(new Date(), 3).toISOString().slice(0, 10);
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id")
      .eq("team_id", invoice.team_id)
      .eq("amount", invoice.amount)
      .eq("currency", String(invoice.currency).toUpperCase())
      .gte("date", since)
      .eq("status", "completed");

    if (transactions && transactions.length === 1) {
      await updateInvoiceStatus({ invoiceId, status: "paid", paid_at: new Date().toISOString() });
      return;
    }

    const isOverdue = new Date(invoice.due_date) < new Date();
    if (isOverdue && invoice.status !== "paid" && invoice.status !== "cancelled") {
      await updateInvoiceStatus({ invoiceId, status: "overdue" });
    }
  },
});
