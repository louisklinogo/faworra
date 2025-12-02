type Status = "draft" | "overdue" | "paid" | "unpaid" | "canceled" | "scheduled";

const LABELS: Record<Status, string> = {
  draft: "Draft",
  overdue: "Overdue",
  paid: "Paid",
  unpaid: "Unpaid",
  canceled: "Canceled",
  scheduled: "Scheduled",
};

const STYLES: Record<Status, string> = {
  draft: "text-[#878787] bg-[#F2F1EF] dark:text-[#C3C3C3] dark:bg-[#1D1D1D]",
  overdue: "text-[#FFD02B] bg-[#FFD02B]/10",
  paid: "text-[#00C969] bg-[#00C969]/10",
  unpaid: "text-[#1D1D1D] bg-[#878787]/10 dark:text-[#F5F5F3] dark:bg-[#F5F5F3]/10",
  canceled: "text-[#878787] bg-[#F2F1EF] dark:text-[#C3C3C3] dark:bg-[#1D1D1D]",
  scheduled: "text-[#1F6FEB] bg-[#1F6FEB]/10",
};

type Props = {
  status?: Status;
};

export function InvoiceStatus({ status }: Props) {
  if (!status) return null;

  return (
    <span
      className={`px-2 py-0.5 rounded-full font-mono text-[10px] inline-flex max-w-full ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
