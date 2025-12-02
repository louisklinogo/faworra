import { createJobSupabaseClient } from "../clients/supabase";

export async function updateInvoiceStatus({
  invoiceId,
  status,
  paid_at,
}: {
  invoiceId: string;
  status: "overdue" | "paid" | "partially_paid";
  paid_at?: string;
}): Promise<void> {
  const supabase = createJobSupabaseClient();
  await supabase
    .from("invoices")
    .update({ status, paid_at: paid_at ?? null })
    .eq("id", invoiceId);
}
