/**
 * Banking Provider Facade
 * Midday parity: strategy pattern for multi-provider support
 *
 * Phase 1: Mono only
 * Future: Plaid, GoCardless, Teller, etc.
 */

import type { ProviderInterface } from "./interface";
import { MonoProvider } from "./providers/mono";
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

// ─── Supported Providers ─────────────────────────────────────────────────────

export type SupportedProvider = "mono";

// ─── Provider Facade Params ─────────────────────────────────────────────────

export interface ProviderFacadeParams {
	provider: SupportedProvider;
}

// ─── Provider Facade (Strategy Pattern) ──────────────────────────────────────

/**
 * Provider Facade
 * Meday parity: constructs the correct provider and forwards operations
 *
 * Usage:
 * ```typescript
 * const provider = new ProviderFacade({ provider: 'mono' });
 * const transactions = await provider.getTransactions({ accountId: '...' });
 * ```
 */
export class ProviderFacade implements ProviderInterface {
	private provider: ProviderInterface;

	constructor(params: ProviderFacadeParams) {
		this.provider = this.createProvider(params.provider);
	}

	/**
	 * Create the appropriate provider implementation
	 */
	private createProvider(provider: SupportedProvider): ProviderInterface {
		switch (provider) {
			case "mono":
				return new MonoProvider();
			// Future providers:
			// case "plaid":
			//   return new PlaidProvider();
			// case "gocardless":
			//   return new GoCardlessProvider();
			default:
				throw new Error(`Unsupported provider: ${provider}`);
		}
	}

	// ─── Core Operations ──────────────────────────────────────────────────────

	async getTransactions(
		params: GetTransactionsParams
	): Promise<GetTransactionsResult> {
		return this.provider.getTransactions(params);
	}

	async getAccounts(params: GetAccountsParams): Promise<Account[]> {
		return this.provider.getAccounts(params);
	}

	async getAccountBalance(params: GetBalanceParams): Promise<Balance> {
		return this.provider.getAccountBalance(params);
	}

	async getInstitutions(
		params?: GetInstitutionsParams
	): Promise<Institution[]> {
		return this.provider.getInstitutions(params);
	}

	// ─── Status & Health ──────────────────────────────────────────────────────

	async getHealthCheck(): Promise<HealthCheckResult> {
		return this.provider.getHealthCheck();
	}

	async getConnectionStatus(
		params: GetConnectionStatusParams
	): Promise<ConnectionStatusResult> {
		return this.provider.getConnectionStatus(params);
	}

	// ─── Cleanup ──────────────────────────────────────────────────────────────

	async deleteAccounts(params: DeleteAccountsParams): Promise<void> {
		return this.provider.deleteAccounts(params);
	}

	async deleteConnection(params: DeleteConnectionParams): Promise<void> {
		return this.provider.deleteConnection(params);
	}
}

// ─── Health Check Aggregation ────────────────────────────────────────────────

/**
 * Fetch health check across all supported providers
 * Midday parity: concurrent health checks
 */
export async function getAllProvidersHealthCheck(): Promise<
	HealthCheckResult[]
> {
	const providers: SupportedProvider[] = ["mono"];
	const results: HealthCheckResult[] = [];

	// Run health checks concurrently
	const checks = providers.map(async (providerName) => {
		try {
			const provider = new ProviderFacade({ provider: providerName });
			return await provider.getHealthCheck();
		} catch (error) {
			return {
				provider: providerName,
				status: "down" as const,
				message: error instanceof Error ? error.message : "Unknown error",
			};
		}
	});

	const checkResults = await Promise.all(checks);
	results.push(...checkResults);

	return results;
}

// ─── Re-exports ──────────────────────────────────────────────────────────────

export type { ProviderInterface } from "./interface";
export * from "./interface";
export { MonoProvider } from "./providers/mono";
export * from "./types";
