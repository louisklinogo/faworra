type FormatAmountParams = {
	currency: string;
	amount: number;
	locale?: string | null;
	maximumFractionDigits?: number;
	minimumFractionDigits?: number;
};

type FormatAccountNameParams = {
	name: string;
	currency?: string;
};

export function formatAmount({
	currency,
	amount,
	locale = "en-US",
	minimumFractionDigits,
	maximumFractionDigits,
}: FormatAmountParams) {
	if (!currency) {
		return;
	}

	const safeAmount = Number.isFinite(amount) ? amount : 0;
	const safeLocale = locale ?? undefined;

	return Intl.NumberFormat(safeLocale, {
		style: "currency",
		currency,
		minimumFractionDigits: minimumFractionDigits ?? 2,
		maximumFractionDigits: maximumFractionDigits ?? 2,
	}).format(safeAmount / 100); // Convert from minor units
}

export function formatAccountName({
	name,
	currency,
}: FormatAccountNameParams): string {
	if (currency) {
		return `${name} (${currency.toUpperCase()})`;
	}
	return name;
}

export function formatDate(
	date: string | Date,
	formatStr?: string | null
): string {
	const d = typeof date === "string" ? new Date(date) : date;

	// Simple date formatting - can be enhanced with date-fns if needed
	const options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "short",
		day: "numeric",
	};

	return d.toLocaleDateString("en-US", options);
}

export function formatSize(bytes: number): string {
	if (bytes === 0) {
		return "0 B";
	}
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}
