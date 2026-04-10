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
	Institution,
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
export function transformTransaction(
	monoTx: MonoTransactionResponse,
	accountId: string
): Transaction {
	// Normalize amount: debit = expense = negative, credit = income = positive
	const normalizedAmount = monoTx.type === "debit" 
		? -Math.abs(monoTx.amount) 
		: Math.abs(monoTx.amount);

	// Parse category - Mono returns strings like "unknown" or specific categories
	const category = monoTx.category && monoTx.category !== "unknown"
		? monoTx.category
		: undefined;

	return {
		id: monoTx.id,
		accountId,
		amount: normalizedAmount,
		currency: "NGN", // Default - will be overridden by account currency
		date: monoTx.date,
		status: "posted", // Mono transactions are already posted
		balance: monoTx.balance,
		category,
		name: monoTx.narration,
		description: monoTx.narration,
		provider: "mono",
		internalId: monoTx.id,
	};
}

/**
 * Transform multiple transactions
 */
export function transformTransactions(
	monoTxs: MonoTransactionResponse[],
	accountId: string
): Transaction[] {
	return monoTxs.map((tx) => transformTransaction(tx, accountId));
}

// ─── Account Transform ────────────────────────────────────────────────────────

/**
 * Transform Mono account to normalized form
 */
export function transformAccount(
	monoAccount: MonoAccountResponse
): Account {
	// Map Mono account types to our standard types
	const accountType = mapAccountType(monoAccount.type);

	return {
		id: monoAccount.id,
		name: monoAccount.name,
		currency: monoAccount.currency,
		type: accountType,
		institutionId: monoAccount.institution?.bank_code ?? "unknown",
		balance: monoAccount.balance,
		availableBalance: monoAccount.balance, // Mono doesn't differentiate
		provider: "mono",
		accountNumber: monoAccount.account_number,
	};
}

/**
 * Map Mono account type strings to our standard types
 */
function mapAccountType(monoType: string): Account["type"] {
	const typeMap: Record<string, Account["type"]> = {
		// Standard bank accounts
		"current": "checking",
		"checking": "checking",
		"savings": "savings",
		// Credit accounts
		"credit": "credit",
		"credit_card": "credit",
		// Mobile money
		"mobile_money": "other",
		"momo": "other",
		// Other
		"investment": "other",
		"loan": "other",
		"other": "other",
	};

	return typeMap[monoType.toLowerCase()] ?? "other";
}

// ─── Institution Transform ────────────────────────────────────────────────────

/**
 * Transform Mono institution to normalized form
 */
export function transformInstitution(
	monoInstitution: NonNullable<MonoAccountResponse["institution"]> & {
		id?: string;
		countries?: string[];
	}
): Institution {
	return {
		id: monoInstitution.bank_code,
		name: monoInstitution.name,
		logo: null, // Mono doesn't provide logos in this response
		provider: "mono",
		type: monoInstitution.type,
		bankCode: monoInstitution.bank_code,
		countries: monoInstitution.countries ?? [],
	};
}

// ─── Balance Transform ────────────────────────────────────────────────────────

/**
 * Transform Mono account to balance object
 */
export function transformBalance(
	monoAccount: MonoAccountResponse
): Balance {
	return {
		accountId: monoAccount.id,
		current: monoAccount.balance,
		available: monoAccount.balance,
		currency: monoAccount.currency,
	};
}
