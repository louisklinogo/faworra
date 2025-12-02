export function formatMoney(
  amount: number | string | null | undefined,
  {
    currency,
    locale,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  }: { currency: string; locale: string; minimumFractionDigits?: number; maximumFractionDigits?: number },
) {
  if (amount === null || amount === undefined) return "";
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(num)) return "";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(num);
  } catch {
    // Fallback to plain number if locale/currency invalid
    return String(num);
  }
}
