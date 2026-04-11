/**
 * Provider interface contract
 * Midday parity: all providers implement this interface
 */

import type {
	Account,
	Balance,
	ConnectionStatusResult,
	DeleteAccountsParams,
	DeleteConnectionParams,
	GetAccountsParams,
	GetBalanceParams,
	GetConnectionStatusParams,
	GetInstitutionsParams,
	GetTransactionsParams,
	GetTransactionsResult,
	HealthCheckResult,
	Institution,
} from "./types";

export interface ProviderInterface {
	// ─── Cleanup ──────────────────────────────────────────────────────────────

	/**
	 * Delete accounts from the provider
	 */
	deleteAccounts(params: DeleteAccountsParams): Promise<void>;

	/**
	 * Delete the entire connection
	 */
	deleteConnection(params: DeleteConnectionParams): Promise<void>;

	/**
	 * Fetch current balance for an account
	 */
	getAccountBalance(params: GetBalanceParams): Promise<Balance>;

	/**
	 * Fetch accounts for a connection
	 */
	getAccounts(params: GetAccountsParams): Promise<Account[]>;

	/**
	 * Get the connection status
	 */
	getConnectionStatus(
		params: GetConnectionStatusParams
	): Promise<ConnectionStatusResult>;

	// ─── Status & Health ──────────────────────────────────────────────────────

	/**
	 * Check if the provider is operational
	 */
	getHealthCheck(): Promise<HealthCheckResult>;

	/**
	 * Fetch institutions for this provider
	 */
	getInstitutions(params?: GetInstitutionsParams): Promise<Institution[]>;
	// ─── Core Operations ──────────────────────────────────────────────────────

	/**
	 * Fetch transactions for an account
	 */
	getTransactions(
		params: GetTransactionsParams
	): Promise<GetTransactionsResult>;
}

// ─── Provider Methods (for ProviderInterface) ───────────────────────────────

export type TransactionsParams = GetTransactionsParams;
export type AccountsParams = GetAccountsParams;
export type BalanceParams = GetBalanceParams;
export type InstitutionsParams = GetInstitutionsParams;
export type ConnectionParams = GetConnectionStatusParams;
export type DeleteParams = DeleteAccountsParams | DeleteConnectionParams;

// ─── Aggregated Institutions Result ──────────────────────────────────────────

export interface FetchAllInstitutionsResult {
	errors: Array<{ provider: string; error: string }>;
	institutions: Institution[];
	succeededProviders: string[];
}
