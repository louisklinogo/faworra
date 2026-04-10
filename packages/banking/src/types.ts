/**
 * Common types for the banking package
 * Midday parity: normalized provider-agnostic models
 */

// ─── Institution ─────────────────────────────────────────────────────────────

export interface Institution {
	id: string;
	name: string;
	logo: string | null;
	provider: string; // 'mono', 'plaid', 'gocardless', etc.
	countries?: string[]; // e.g., ['NG', 'GH']
	type?: string; // e.g., 'PERSONAL_BANKING'
	bankCode?: string; // Mono-specific: e.g., '058' for GTBank
}

// ─── Account ─────────────────────────────────────────────────────────────────

export type AccountType = 
	| "checking"
	| "savings"
	| "credit"
	| "cash"
	| "other";

export interface Account {
	id: string; // External provider account ID
	name: string;
	currency: string;
	type: AccountType;
	institutionId: string;
	balance: number;
	availableBalance: number;
	creditLimit?: number;
	// Regional identifiers (Midday parity)
	iban?: string;
	bic?: string;
	sortCode?: string;
	accountNumber?: string;
	// Provider metadata
	provider: string;
	resourceId?: string;
	enrollmentId?: string;
	expiresAt?: string;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionStatus = 
	| "posted"
	| "pending"
	| "excluded";

export interface Transaction {
	id: string; // External provider transaction ID
	accountId: string;
	// Amount is SIGNED (Midday parity)
	// Positive = income/credit, Negative = expense/debit
	amount: number;
	currency: string;
	date: string;
	status: TransactionStatus;
	// Running balance at transaction time
	balance?: number;
	// Category (provider-specific or normalized)
	category?: string;
	// Counterparty
	counterpartyName?: string;
	merchantName?: string;
	// Transaction details
	name?: string;
	description?: string;
	method?: string; // e.g., 'transfer', 'card_purchase', 'momo'
	// Multi-currency (Midday parity)
	currencyRate?: number;
	currencySource?: string;
	// Provider metadata
	provider: string;
	internalId?: string; // Mono-specific: MongoDB ObjectId
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export interface Balance {
	accountId: string;
	current: number;
	available: number;
	creditLimit?: number;
	currency: string;
	lastUpdated?: string;
}

// ─── Health Check ────────────────────────────────────────────────────────────

export type HealthStatus = 
	| "operational"
	| "degraded"
	| "down";

export interface HealthCheckResult {
	provider: string;
	status: HealthStatus;
	latency?: number;
	message?: string;
}

// ─── Connection Status ──────────────────────────────────────────────────────

export type ConnectionStatus =
	| "connected"
	| "disconnected"
	| "error"
	| "pending"
	| "expired";

export interface ConnectionStatusResult {
	status: ConnectionStatus;
	lastSyncedAt?: string;
	errorCount: number;
	message?: string;
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
	toDate?: string;
	limit?: number;
	offset?: number;
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
	institutions: Institution[];
	errors: Array<{ provider: string; error: string }>;
	succeededProviders: string[];
}

export interface GetAccountsResult {
	accounts: Account[];
}

export interface GetTransactionsResult {
	transactions: Transaction[];
	hasMore: boolean;
	total?: number;
}

export interface GetBalanceResult {
	balance: Balance;
}

// ─── Mono-Specific Types ─────────────────────────────────────────────────────

export interface MonoAccountResponse {
	id: string;
	status?: string;
	data?: {
		id: string;
		name: string;
		account_number: string;
		currency: string;
		type: string;
		balance?: {
			amount?: number;
			currency?: string;
			available_balance?: number;
			credit_limit?: number;
		};
		institution?: {
			id: string;
			name: string;
			bank_code: string;
			type: string;
		};
		_meta?: {
			enrollment_id: string;
		};
	};
}

export interface MonoTransactionResponse {
	id: string;
	narration: string;
	amount: number;
	type: "debit" | "credit";
	balance: number;
	date: string;
	category: string;
}

export interface MonoLinkingResult {
	mono_url: string; // URL for Connect Link widget
}
