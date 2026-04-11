/**
 * Transform Mono-specific responses to common types
 *
 * Key transformation: amount normalization
 * - Mono returns: { type: 'debit'|'credit', amount: positive_number }
 * - We store: amount as signed number (negative for expenses)
 *
 * Midday parity: same signed amount pattern
 */

import type {
	Account,
	Balance,
	MonoAccountResponse,
	MonoTransactionResponse,
	Transaction,
} from "../../types";

// ─── Transaction Transform ────────────────────────────────────────────────────

/**
 * Transform Mono transaction to normalized form
 *
 * Mono: type = 'debit' | 'credit', amount = positive number
 * Faworra: amount = signed number (negative for expenses)
 */
export function transformMonoTransaction(
	monoTx: MonoTransactionResponse
): Transaction {
	// Normalize amount: debit = expense = negative, credit = income = positive
	const normalizedAmount =
		monoTx.type === "debit"
			? -Math.abs(monoTx.amount)
			: Math.abs(monoTx.amount);

	return {
		id: monoTx.id,
		accountId: monoTx.id, // Will be overridden by caller
		amount: normalizedAmount,
		currency: "GHS", // Default - actual currency from account
		date: monoTx.date,
		status: "posted",
		balance: monoTx.balance,
		category: monoTx.category !== "unknown" ? monoTx.category : undefined,
		name: monoTx.narration,
		description: monoTx.narration,
		provider: "mono",
		internalId: monoTx.id,
	};
}

// ─── Account Transform ────────────────────────────────────────────────────────

/**
 * Transform Mono account to normalized form
 */
export function transformMonoAccount(
	monoAccount: MonoAccountResponse
): Account {
	const data = monoAccount.data;
	if (!data) {
		throw new Error("Mono account response missing data");
	}

	const balance = data.balance;
	const institution = data.institution;

	return {
		id: monoAccount.id,
		name: data.name ?? "Unknown",
		currency: data.currency ?? "NGN",
		type: mapAccountType(data.type ?? "other"),
		institutionId: institution?.bank_code ?? "unknown",
		balance: balance?.amount ?? 0,
		availableBalance: balance?.available_balance ?? 0,
		creditLimit: balance?.credit_limit ?? undefined,
		provider: "mono",
		accountNumber: data.account_number,
		enrollmentId: data._meta?.enrollment_id,
	};
}

/**
 * Map Mono account type strings to our standard types
 */
function mapAccountType(monoType: string): Account["type"] {
	const typeMap: Record<string, Account["type"]> = {
		// Standard bank accounts
		current: "checking",
		checking: "checking",
		savings: "savings",
		// Credit accounts
		credit: "credit",
		credit_card: "credit",
		// Mobile money
		mobile_money: "other",
		momo: "other",
		// Other
		investment: "other",
		loan: "other",
		other: "other",
	};

	return typeMap[monoType.toLowerCase()] ?? "other";
}

// ─── Balance Transform ────────────────────────────────────────────────────────

/**
 * Extract balance from Mono account response
 */
export function transformMonoBalance(
	monoAccount: MonoAccountResponse
): Balance {
	const data = monoAccount.data;
	const balance = data?.balance;

	return {
		accountId: monoAccount.id,
		current: balance?.amount ?? 0,
		available: balance?.available_balance ?? 0,
		creditLimit: balance?.credit_limit ?? undefined,
		currency: balance?.currency ?? data?.currency ?? "NGN",
	};
}
