/**
 * Common types for the banking package
 * Midday parity: normalized provider-agnostic models
 */

// ─── Institution ─────────────────────────────────────────────────────────────

export interface Institution {
	bankCode?: string; // Mono-specific: e.g., '058' for GTBank
	countries?: string[]; // e.g., ['NG', 'GH']
	id: string;
	logo: string | null;
	name: string;
	provider: string; // 'mono', 'plaid', 'gocardless', etc.
	type?: string; // e.g., 'PERSONAL_BANKING'
}

// ─── Account ─────────────────────────────────────────────────────────────────

export type AccountType = "checking" | "savings" | "credit" | "cash" | "other";

export interface Account {
	accountNumber?: string;
	availableBalance: number;
	balance: number;
	bic?: string;
	creditLimit?: number;
	currency: string;
	enrollmentId?: string;
	expiresAt?: string;
	// Regional identifiers (Midday parity)
	iban?: string;
	id: string; // External provider account ID
	institutionId: string;
	name: string;
	// Provider metadata
	provider: string;
	resourceId?: string;
	sortCode?: string;
	type: AccountType;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionStatus = "posted" | "pending" | "excluded";

export interface Transaction {
	accountId: string;
	// Amount is SIGNED (Midday parity)
	// Positive = income/credit, Negative = expense/debit
	amount: number;
	// Running balance at transaction time
	balance?: number;
	// Category (provider-specific or normalized)
	category?: string;
	// Counterparty
	counterpartyName?: string;
	currency: string;
	// Multi-currency (Midday parity)
	currencyRate?: number;
	currencySource?: string;
	date: string;
	description?: string;
	id: string; // External provider transaction ID
	internalId?: string; // Mono-specific: MongoDB ObjectId
	merchantName?: string;
	method?: string; // e.g., 'transfer', 'card_purchase', 'momo'
	// Transaction details
	name?: string;
	// Provider metadata
	provider: string;
	status: TransactionStatus;
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export interface Balance {
	accountId: string;
	available: number;
	creditLimit?: number;
	currency: string;
	current: number;
	lastUpdated?: string;
}

// ─── Health Check ────────────────────────────────────────────────────────────

export type HealthStatus = "operational" | "degraded" | "down";

export interface HealthCheckResult {
	latency?: number;
	message?: string;
	provider: string;
	status: HealthStatus;
}

// ─── Connection Status ──────────────────────────────────────────────────────

export type ConnectionStatus =
	| "connected"
	| "disconnected"
	| "error"
	| "pending"
	| "expired";

export interface ConnectionStatusResult {
	errorCount: number;
	lastSyncedAt?: string;
	message?: string;
	status: ConnectionStatus;
}

// ─── Params Types ────────────────────────────────────────────────────────────

export interface GetInstitutionsParams {
	country?: string; // e.g., 'NG', 'GH'
	providers?: string[]; // Filter by provider
}

export interface GetAccountsParams {
	connectionId: string;
}

export interface GetTransactionsParams {
	accountId: string;
	fromDate?: string;
	limit?: number;
	offset?: number;
	toDate?: string;
}

export interface GetBalanceParams {
	accountId: string;
}

export interface GetConnectionStatusParams {
	connectionId: string;
}

export interface DeleteAccountsParams {
	accountIds: string[];
}

export interface DeleteConnectionParams {
	connectionId: string;
}

// ─── Result Types ────────────────────────────────────────────────────────────

export interface GetInstitutionsResult {
	errors: Array<{ provider: string; error: string }>;
	institutions: Institution[];
	succeededProviders: string[];
}

export interface GetAccountsResult {
	accounts: Account[];
}

export interface GetTransactionsResult {
	hasMore: boolean;
	total?: number;
	transactions: Transaction[];
}

export interface GetBalanceResult {
	balance: Balance;
}

// ─── Mono-Specific Types ─────────────────────────────────────────────────────

export interface MonoAccountResponse {
	data?: {
		account?: {
			id?: string;
			_id?: string;
			name: string;
			account_number?: string;
			accountNumber?: string;
			currency: string;
			type: string;
			balance?: number;
			bvn?: string;
			institution?: {
				id?: string;
				name: string;
				bank_code?: string;
				bankCode?: string;
				type: string;
			};
			created_at?: string;
			updated_at?: string;
		};
		customer?: {
			id?: string;
		};
		meta?: {
			auth_method?: string;
			data_request_id?: string;
			data_status?: string;
			retrieved_data?: string[];
			session_id?: string;
		};
	};
	id: string;
	message?: string;
	status?: string;
	timestamp?: string;
}

export interface MonoTransactionResponse {
	amount: number;
	balance: number;
	category: string;
	date: string;
	id: string;
	narration: string;
	type: "debit" | "credit";
}

export interface MonoLinkingResult {
	mono_url: string; // URL for Connect Link widget
}
