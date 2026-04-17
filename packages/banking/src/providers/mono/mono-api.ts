/**
 * Mono API client
 * Midday parity: implements real API calls to Mono
 *
 * Reference: docs/mono/financial-data/*.md
 * API docs: https://mono.co/docs
 */

import type { MonoAccountResponse, MonoTransactionResponse } from "../../types";

export interface MonoApiConfig {
	baseUrl?: string;
	secretKey?: string;
}

const DEFAULT_BASE_URL = "https://api.withmono.com";

/**
 * Mono API client
 * Implements real API calls to Mono
 */
export class MonoApi {
	private _secretKey: string;
	private _baseUrl: string;

	constructor(config?: MonoApiConfig) {
		this._secretKey = config?.secretKey ?? process.env.MONO_SECRET_KEY ?? "";
		this._baseUrl = config?.baseUrl ?? DEFAULT_BASE_URL;
	}

	private async request<T>(
		endpoint: string,
		options: {
			method?: "GET" | "POST" | "DELETE";
			body?: unknown;
			headers?: Record<string, string>;
		} = {}
	): Promise<T> {
		const { method = "GET", body, headers = {} } = options;

		const response = await fetch(`${this._baseUrl}${endpoint}`, {
			method,
			headers: {
				"Content-Type": "application/json",
				"mono-sec-key": this._secretKey,
				...headers,
			},
			body: body ? JSON.stringify(body) : undefined,
		});

		const data = (await response.json()) as T;

		if (!response.ok) {
			throw new Error(
				`Mono API error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`
			);
		}

		return data;
	}

	// ─── Account Linking ──────────────────────────────────────────────────────

	/**
	 * Initiate account linking
	 * POST /v2/accounts/initiate
	 *
	 * Mono docs reference: docs/mono/financial-data/connect-link.md
	 */
	async initiateLinking(params: {
		customer: {
			email: string;
			name: string;
		};
		meta?: Record<string, unknown>;
		redirect_url?: string;
		scope?: "auth";
	}): Promise<{ data: { mono_url: string } }> {
		return this.request<{ data: { mono_url: string } }>(
			"/v2/accounts/initiate",
			{
			method: "POST",
			body: {
				customer: params.customer,
				meta: params.meta,
				redirect_url: params.redirect_url,
				scope: params.scope ?? "auth",
			},
		}
		);
	}

	/**
	 * Auth callback - exchange code for account ID
	 * POST /v2/accounts/auth
	 */
	async auth(params: { code: string }): Promise<{ id: string }> {
		return this.request<{ id: string }>("/v2/accounts/auth", {
			method: "POST",
			body: params,
		});
	}

	// ─── Account Information ──────────────────────────────────────────────────

	/**
	 * Get account details
	 * GET /v2/accounts/{id}
	 */
	async getAccount(accountId: string): Promise<MonoAccountResponse> {
		return this.request<MonoAccountResponse>(`/v2/accounts/${accountId}`);
	}

	/**
	 * Get institutions list
	 * GET /v2/institutions
	 */
	async getInstitutions(): Promise<
		Array<{
			id: string;
			name: string;
			type: string;
			countries: string[];
		}>
	> {
		return this.request<
			Array<{
				id: string;
				name: string;
				type: string;
				countries: string[];
			}>
		>("/v2/institutions");
	}

	// ─── Transactions ──────────────────────────────────────────────────────────

	/**
	 * Get transactions for an account
	 * GET /v2/accounts/{id}/transactions
	 */
	async getTransactions(
		accountId: string,
		params?: {
			from?: string;
			to?: string;
			limit?: number;
			offset?: number;
		}
	): Promise<{
		data: MonoTransactionResponse[];
		paging: { total: number; page: number; next?: string };
	}> {
		const searchParams = new URLSearchParams();
		if (params?.from) {
			searchParams.set("from", params.from);
		}
		if (params?.to) {
			searchParams.set("to", params.to);
		}
		if (params?.limit) {
			searchParams.set("limit", String(params.limit));
		}
		if (params?.offset) {
			searchParams.set("offset", String(params.offset));
		}

		const query = searchParams.toString();
		return this.request<{
			data: MonoTransactionResponse[];
			paging: { total: number; page: number; next?: string };
		}>(`/v2/accounts/${accountId}/transactions${query ? `?${query}` : ""}`);
	}

	// ─── Real-Time Data ───────────────────────────────────────────────────────

	/**
	 * Manual refresh - trigger balance/transactions update
	 * POST /v2/accounts/{id}/refresh
	 */
	async refreshAccount(accountId: string): Promise<{ status: string }> {
		return this.request<{ status: string }>(
			`/v2/accounts/${accountId}/refresh`,
			{
				method: "POST",
			}
		);
	}
}
