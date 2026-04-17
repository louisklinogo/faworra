/**
 * Mono Provider implementation
 * Midday parity: implements ProviderInterface with real Mono API calls
 *
 * Reference: docs/mono/financial-data/*.md
 */

import type { ProviderInterface } from "../../interface";
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
} from "../../types";
import { MonoApi } from "./mono-api";
import { transformMonoAccount, transformMonoTransaction } from "./transform";

export interface MonoProviderConfig {
	baseUrl?: string;
	secretKey?: string;
}

const PROVIDER_NAME = "mono";

export class MonoProvider implements ProviderInterface {
	private _api: MonoApi;

	constructor(config?: MonoProviderConfig) {
		this._api = new MonoApi(config);
	}

	// ─── Core Operations ──────────────────────────────────────────────────────

	async getTransactions(
		params: GetTransactionsParams
	): Promise<GetTransactionsResult> {
		console.log(`[${PROVIDER_NAME}] getTransactions called`, {
			accountId: params.accountId,
		});

		const result = await this._api.getTransactions(params.accountId, {
			from: params.fromDate,
			to: params.toDate,
			limit: 100,
		});

		const transactions = result.data.map(transformMonoTransaction);

		return {
			transactions,
			hasMore: !!result.paging.next,
			total: result.paging.total,
		};
	}

	async getAccounts(params: GetAccountsParams): Promise<Account[]> {
		console.log(`[${PROVIDER_NAME}] getAccounts called`, {
			connectionId: params.connectionId,
		});

		const account = await this._api.getAccount(params.connectionId);
		return [transformMonoAccount(account)];
	}

	async getAccountBalance(params: GetBalanceParams): Promise<Balance> {
		console.log(`[${PROVIDER_NAME}] getAccountBalance called`, {
			accountId: params.accountId,
		});

		const account = await this._api.getAccount(params.accountId);
		const accountData = account.data?.account;

		if (typeof accountData?.balance !== "number") {
			throw new Error("No balance data returned from Mono");
		}

		return {
			accountId: params.accountId,
			current: accountData.balance,
			available: accountData.balance,
			currency: accountData.currency ?? "NGN",
		};
	}

	async getInstitutions(
		_params?: GetInstitutionsParams
	): Promise<Institution[]> {
		console.log(`[${PROVIDER_NAME}] getInstitutions called`);

		const institutions = await this._api.getInstitutions();

		return institutions.map((inst) => ({
			id: inst.id,
			name: inst.name,
			type: inst.type,
			countries: inst.countries,
			provider: PROVIDER_NAME,
			logo: null,
		}));
	}

	// ─── Status & Health ──────────────────────────────────────────────────────

	async getHealthCheck(): Promise<HealthCheckResult> {
		console.log(`[${PROVIDER_NAME}] getHealthCheck called`);

		try {
			// Simple health check - try to get institutions
			await this._api.getInstitutions();
			return {
				provider: PROVIDER_NAME,
				status: "operational",
			};
		} catch (error) {
			return {
				provider: PROVIDER_NAME,
				status: "degraded",
				message: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async getConnectionStatus(
		params: GetConnectionStatusParams
	): Promise<ConnectionStatusResult> {
		console.log(`[${PROVIDER_NAME}] getConnectionStatus called`, {
			connectionId: params.connectionId,
		});

		try {
			// Try to get account info - if it succeeds, connection is valid
			await this._api.getAccount(params.connectionId);

			return {
				status: "connected" as const,
				lastSyncedAt: new Date().toISOString(),
				errorCount: 0,
			};
		} catch (error) {
			return {
				status: "disconnected" as const,
				errorCount: 1,
				message: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	// ─── Cleanup ──────────────────────────────────────────────────────────────

	async deleteAccounts(_params: DeleteAccountsParams): Promise<void> {
		// Mono doesn't have a direct delete accounts endpoint
		// Use deleteConnection instead
		console.log(
			`[${PROVIDER_NAME}] deleteAccounts - use deleteConnection instead`
		);
	}

	async deleteConnection(params: DeleteConnectionParams): Promise<void> {
		console.log(`[${PROVIDER_NAME}] deleteConnection called`, {
			connectionId: params.connectionId,
		});

		// Mono doesn't have a delete endpoint in their v2 API
		// Mark as disconnected in our database instead
		throw new Error("Mono does not support connection deletion via API");
	}

	// ─── Mono-Specific Methods ────────────────────────────────────────────────

	/**
	 * Initiate account linking
	 * Mono-specific: returns URL for Connect Link widget
	 */
	async initiateLinking(params: {
		customer: {
			email: string;
			name: string;
		};
		meta?: Record<string, unknown>;
		redirectUrl?: string;
	}): Promise<{ monoUrl: string }> {
		const result = await this._api.initiateLinking({
			customer: params.customer,
			meta: params.meta,
			redirect_url: params.redirectUrl,
		});

		return { monoUrl: result.data.mono_url };
	}

	/**
	 * Get raw account data from Mono
	 */
	async getRawAccount(accountId: string) {
		return this._api.getAccount(accountId);
	}

	/**
	 * Trigger manual refresh of account data
	 */
	async refreshAccount(accountId: string): Promise<{ status: string }> {
		return this._api.refreshAccount(accountId);
	}
}
