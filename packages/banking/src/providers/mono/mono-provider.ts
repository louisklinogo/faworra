/**
 * Mono Provider implementation
 * Midday parity: implements ProviderInterface
 * 
 * Phase 1: Stub implementations
 * Phase 2: Real API calls via MonoApi
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
} from "../../types";
import type { ProviderInterface } from "../../interface";
// Phase 2: Import MonoApi when implementing real calls
// import { MonoApi } from "./mono-api";

export interface MonoProviderConfig {
	secretKey?: string;
	baseUrl?: string;
}

const PROVIDER_NAME = "mono";

export class MonoProvider implements ProviderInterface {
	// Phase 2: Add API client when implementing real calls
	// private _api: MonoApi;

	constructor(_config?: MonoProviderConfig) {
		// Phase 2: Initialize API client
		// this._api = new MonoApi(config);
	}

	// ─── Core Operations ──────────────────────────────────────────────────────

	async getTransactions(
		params: GetTransactionsParams
	): Promise<GetTransactionsResult> {
		console.log(`[${PROVIDER_NAME}] getTransactions called`, params);
		
		// TODO: Implement in Phase 2
		throw new Error("MonoProvider.getTransactions not implemented - Phase 1 stub");
	}

	async getAccounts(params: GetAccountsParams): Promise<Account[]> {
		console.log(`[${PROVIDER_NAME}] getAccounts called`, params);
		
		// TODO: Implement in Phase 2
		throw new Error("MonoProvider.getAccounts not implemented - Phase 1 stub");
	}

	async getAccountBalance(params: GetBalanceParams): Promise<Balance> {
		console.log(`[${PROVIDER_NAME}] getAccountBalance called`, params);
		
		// TODO: Implement in Phase 2
		throw new Error("MonoProvider.getAccountBalance not implemented - Phase 1 stub");
	}

	async getInstitutions(
		params?: GetInstitutionsParams
	): Promise<Institution[]> {
		console.log(`[${PROVIDER_NAME}] getInstitutions called`, params);
		
		// TODO: Implement in Phase 2
		throw new Error("MonoProvider.getInstitutions not implemented - Phase 1 stub");
	}

	// ─── Status & Health ──────────────────────────────────────────────────────

	async getHealthCheck(): Promise<HealthCheckResult> {
		console.log(`[${PROVIDER_NAME}] getHealthCheck called`);
		
		// TODO: Implement real health check in Phase 2
		return {
			provider: PROVIDER_NAME,
			status: "operational",
			message: "Phase 1 stub - health check not implemented",
		};
	}

	async getConnectionStatus(
		params: GetConnectionStatusParams
	): Promise<ConnectionStatusResult> {
		console.log(`[${PROVIDER_NAME}] getConnectionStatus called`, params);
		
		// TODO: Implement in Phase 2
		throw new Error("MonoProvider.getConnectionStatus not implemented - Phase 1 stub");
	}

	// ─── Cleanup ──────────────────────────────────────────────────────────────

	async deleteAccounts(params: DeleteAccountsParams): Promise<void> {
		console.log(`[${PROVIDER_NAME}] deleteAccounts called`, params);
		
		throw new Error("MonoProvider.deleteAccounts not implemented - Phase 1 stub");
	}

	async deleteConnection(params: DeleteConnectionParams): Promise<void> {
		console.log(`[${PROVIDER_NAME}] deleteConnection called`, params);
		
		throw new Error("MonoProvider.deleteConnection not implemented - Phase 1 stub");
	}

	// ─── Mono-Specific Methods ────────────────────────────────────────────────

	/**
	 * Initiate account linking
	 * Mono-specific: returns URL for Connect Link widget
	 */
	async initiateLinking(params: {
		meta?: Record<string, unknown>;
		redirectUrl?: string;
	}): Promise<{ monoUrl: string }> {
		console.log(`[${PROVIDER_NAME}] initiateLinking called`, params);
		
		throw new Error("MonoProvider.initiateLinking not implemented - Phase 1 stub");
	}
}
