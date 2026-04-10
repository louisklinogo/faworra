/**
 * Mono API client
 * Stub implementation for Phase 1
 * 
 * Reference: docs/mono/financial-data/*.md
 */

import type {
	MonoAccountResponse,
	MonoTransactionResponse,
} from "../../types";

export interface MonoApiConfig {
	secretKey?: string;
	baseUrl?: string;
}

/**
 * Mono API client
 * Phase 1: Stub - no real implementation
 * Phase 2: Implement real API calls with fetch
 */
export class MonoApi {
	// Phase 2: Add private credentials here
	// private _secretKey: string | undefined;
	// private _baseUrl: string;

	constructor(_config?: MonoApiConfig) {
		// Phase 2: Store credentials
		// this._secretKey = config?.secretKey ?? env.MONO_SECRET_KEY;
		// this._baseUrl = config?.baseUrl ?? "https://api.withmono.com";
	}

	// ─── Account Linking ──────────────────────────────────────────────────────

	/**
	 * Initiate account linking
	 * POST /v2/accounts/initiate
	 * 
	 * Mono docs reference: docs/mono/financial-data/connect-link.md
	 */
	async initiateLinking(_params: {
		meta?: Record<string, unknown>;
		redirect_url?: string;
	}): Promise<{ mono_url: string }> {
		throw new Error("MonoApi.initiateLinking not implemented - Phase 1 stub");
	}

	/**
	 * Auth callback - exchange token for account ID
	 * POST /v2/accounts/auth
	 */
	async auth(_params: { code: string }): Promise<{ id: string }> {
		throw new Error("MonoApi.auth not implemented - Phase 1 stub");
	}

	// ─── Account Information ──────────────────────────────────────────────────

	/**
	 * Get account details
	 * GET /v2/accounts/{id}
	 */
	async getAccount(_accountId: string): Promise<MonoAccountResponse> {
		throw new Error("MonoApi.getAccount not implemented - Phase 1 stub");
	}

	/**
	 * Get institutions list
	 * GET /v2/institutions
	 */
	async getInstitutions(): Promise<Array<{
		id: string;
		name: string;
		type: string;
		countries: string[];
	}>> {
		throw new Error("MonoApi.getInstitutions not implemented - Phase 1 stub");
	}

	// ─── Transactions ──────────────────────────────────────────────────────────

	/**
	 * Get transactions for an account
	 * GET /v2/accounts/{id}/transactions
	 */
	async getTransactions(
		_accountId: string,
		_params?: {
			from?: string;
			to?: string;
			limit?: number;
			offset?: number;
		}
	): Promise<{
		data: MonoTransactionResponse[];
		paging: { total: number; page: number; next?: string };
	}> {
		throw new Error("MonoApi.getTransactions not implemented - Phase 1 stub");
	}

	// ─── Real-Time Data ───────────────────────────────────────────────────────

	/**
	 * Manual refresh - trigger balance/transactions update
	 * POST /v2/accounts/{id}/refresh
	 */
	async refreshAccount(_accountId: string): Promise<{ status: string }> {
		throw new Error("MonoApi.refreshAccount not implemented - Phase 1 stub");
	}
}
