export type TransactionsTab = "all" | "review";
export type TransactionStatus = "excluded" | "pending" | "posted";
// Note: TransactionKind renamed to TransactionType (Midday pattern)
// income/expense determined by amount sign: amount > 0 = income, amount < 0 = expense
export type TransactionType = "expense" | "income";
export type DatePreset =
	| "today"
	| "this_week"
	| "this_month"
	| "last_month"
	| "this_year"
	| "";

type SearchParamInput =
	| URLSearchParams
	| Record<string, string | string[] | undefined>;

export interface TransactionsSearchState {
	accountId: string;
	categorySlug: string;
	dateFrom: string;
	datePreset: DatePreset;
	dateTo: string;
	internal: boolean | undefined;
	maxAmount: string;
	minAmount: string;
	q: string;
	status: TransactionStatus | undefined;
	tab: TransactionsTab;
	// Changed from 'kind' to 'type' (Midday pattern)
	type: TransactionType | undefined;
}

const getValue = (input: SearchParamInput, key: string) => {
	if (input instanceof URLSearchParams) {
		return input.get(key) ?? undefined;
	}

	const value = input[key];

	if (Array.isArray(value)) {
		return value[0];
	}

	return value;
};

const coerceStatus = (
	value: string | undefined
): TransactionStatus | undefined => {
	if (value === "excluded" || value === "pending" || value === "posted") {
		return value;
	}

	return undefined;
};

// Renamed from coerceKind to coerceType (Midday pattern)
const coerceType = (value: string | undefined): TransactionType | undefined => {
	if (value === "expense" || value === "income") {
		return value;
	}

	return undefined;
};

const coerceTab = (value: string | undefined): TransactionsTab => {
	return value === "review" ? "review" : "all";
};

const coerceInternal = (value: string | undefined) => {
	if (value === "true") {
		return true;
	}

	if (value === "false") {
		return false;
	}

	return undefined;
};

const coerceDatePreset = (value: string | undefined): DatePreset => {
	if (
		value === "today" ||
		value === "this_week" ||
		value === "this_month" ||
		value === "last_month" ||
		value === "this_year"
	) {
		return value;
	}
	return "";
};

const getDatePresetRange = (
	preset: DatePreset
): { from: Date; to: Date } | null => {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	switch (preset) {
		case "today":
			return { from: today, to: new Date(today.getTime() + 86_400_000 - 1) };
		case "this_week": {
			const dayOfWeek = today.getDay();
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - dayOfWeek);
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(startOfWeek.getDate() + 6);
			endOfWeek.setHours(23, 59, 59, 999);
			return { from: startOfWeek, to: endOfWeek };
		}
		case "this_month": {
			const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
			const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
			endOfMonth.setHours(23, 59, 59, 999);
			return { from: startOfMonth, to: endOfMonth };
		}
		case "last_month": {
			const startOfLastMonth = new Date(
				today.getFullYear(),
				today.getMonth() - 1,
				1
			);
			const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
			endOfLastMonth.setHours(23, 59, 59, 999);
			return { from: startOfLastMonth, to: endOfLastMonth };
		}
		case "this_year": {
			const startOfYear = new Date(today.getFullYear(), 0, 1);
			const endOfYear = new Date(today.getFullYear(), 11, 31);
			endOfYear.setHours(23, 59, 59, 999);
			return { from: startOfYear, to: endOfYear };
		}
		default:
			return null;
	}
};

const toStartOfDay = (value: string) => {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return undefined;
	}

	date.setHours(0, 0, 0, 0);
	return date;
};

const toEndOfDay = (value: string) => {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return undefined;
	}

	date.setHours(23, 59, 59, 999);
	return date;
};

const toMinorUnits = (value: string) => {
	const parsed = Number.parseFloat(value);

	if (!Number.isFinite(parsed)) {
		return undefined;
	}

	return Math.round(parsed * 100);
};

export const parseTransactionsSearchState = (
	input: SearchParamInput
): TransactionsSearchState => {
	return {
		accountId: getValue(input, "accountId") ?? "",
		categorySlug: getValue(input, "categorySlug") ?? "",
		dateFrom: getValue(input, "dateFrom") ?? "",
		dateTo: getValue(input, "dateTo") ?? "",
		datePreset: coerceDatePreset(getValue(input, "datePreset")),
		internal: coerceInternal(getValue(input, "internal")),
		type: coerceType(getValue(input, "type")),
		maxAmount: getValue(input, "maxAmount") ?? "",
		minAmount: getValue(input, "minAmount") ?? "",
		q: getValue(input, "q") ?? "",
		status: coerceStatus(getValue(input, "status")),
		tab: coerceTab(getValue(input, "tab")),
	};
};

export const toTransactionsListInput = (state: TransactionsSearchState) => {
	let statuses: TransactionStatus[] | undefined;

	if (state.tab === "review") {
		statuses = ["pending"];
	} else if (state.status) {
		statuses = [state.status];
	}

	// Handle date preset
	let dateFrom: Date | undefined;
	let dateTo: Date | undefined;

	if (state.datePreset) {
		const presetRange = getDatePresetRange(state.datePreset);
		if (presetRange) {
			dateFrom = presetRange.from;
			dateTo = presetRange.to;
		}
	} else if (state.dateFrom) {
		dateFrom = toStartOfDay(state.dateFrom);
	}
	if (state.dateTo) {
		dateTo = toEndOfDay(state.dateTo);
	}

	return {
		bankAccountIds: state.accountId ? [state.accountId] : undefined,
		categorySlugs: state.categorySlug ? [state.categorySlug] : undefined,
		dateFrom,
		dateTo,
		internal: state.internal,
		type: state.type,
		limit: 100,
		maxAmount: state.maxAmount ? toMinorUnits(state.maxAmount) : undefined,
		minAmount: state.minAmount ? toMinorUnits(state.minAmount) : undefined,
		q: state.q || undefined,
		statuses,
	};
};
