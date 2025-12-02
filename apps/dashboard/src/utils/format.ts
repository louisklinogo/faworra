type FormatAmountOptions = {
  amount: number;
  currency: string;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export function formatAmount({
  amount,
  currency,
  locale = "en-US",
  maximumFractionDigits,
  minimumFractionDigits,
}: FormatAmountOptions) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(amount);
}

export function formatRelativeTime(date: Date) {
  const now = Date.now();
  const diff = now - date.getTime();

  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(seconds) < 60) {
    return seconds <= 1 ? "just now" : `${seconds}s ago`;
  }
  if (Math.abs(minutes) < 60) {
    return `${minutes}m ago`;
  }
  if (Math.abs(hours) < 24) {
    return `${hours}h ago`;
  }
  return `${days}d ago`;
}
