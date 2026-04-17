/**
 * Sync bank connection
 * Midday parity: fan-out pattern - sync all accounts for a connection
 *
 * Reference: midday/packages/jobs/src/tasks/bank/sync/connection.ts
 * Parity mode: ADAPTED (uses Supabase client like Midday, Mono provider instead of Plaid/GoCardless)
 */

import { createClient } from "@faworra-new/supabase/job";
import type { Database } from "@faworra-new/supabase/types";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { syncConnectionSchema } from "./../../../schema";
import { syncAccount } from "./account";

// Fan-out pattern. We want to trigger a task for each bank account (Transactions, Balance)
export const syncConnection = schemaTask({
	id: "sync-connection",
	maxDuration: 120,
	retry: {
		maxAttempts: 2,
	},
	schema: syncConnectionSchema,
	run: async ({ connectionId, manualSync }, { ctx }) => {
		logger.info("[syncConnection] Environment check", {
			hasSupabaseUrl: !!process.env.SUPABASE_URL,
			hasSupabaseSecretKey: !!process.env.SUPABASE_SECRET_KEY,
		});

		const supabase = createClient();

		logger.info("[syncConnection] Starting sync", {
			connectionId,
			manualSync,
		});

		try {
			// Get bank connection
			// Midday parity: use Supabase client
			const { data: connection, error: connectionError } = await supabase
				.from("bank_connections")
				.select("id, provider, enrollment_id, team_id")
				.eq("id", connectionId)
				.single();

			if (connectionError) {
				logger.error("[syncConnection] Connection query failed", {
					connectionId,
					error: connectionError,
				});
				throw connectionError;
			}

			if (!connection) {
				logger.error("[syncConnection] Connection not found", { connectionId });
				throw new Error("Connection not found");
			}

			logger.info("[syncConnection] Found connection", { connection });

			// Get all enabled bank accounts for this connection
			// Midday pattern: skip accounts with 3+ error retries during background sync
			// Parity: select team_id, type, error_retries for payload building
			const { data: bankAccountsData, error: accountsError } = await supabase
				.from("bank_accounts")
				.select("id, team_id, external_id, currency, sync_status, type, error_retries")
				.eq("bank_connection_id", connectionId)
				.eq("enabled", true)
				.eq("manual", false);

			if (accountsError) {
				logger.error("[syncConnection] Bank accounts query failed", {
					connectionId,
					error: accountsError,
				});
				throw accountsError;
			}

			// Midday parity: filter accounts with 3+ error retries during background sync
			// Applied as post-query filter to avoid Supabase query complexity
			let filteredAccounts = bankAccountsData || [];
			if (!manualSync) {
				filteredAccounts = filteredAccounts.filter(
					(acc) => (acc.error_retries ?? 0) < 4
				);
			}

			if (!filteredAccounts.length) {
				logger.info(
					"[syncConnection] No enabled, non-manual accounts to sync (check bank_accounts.manual=false for provider-linked accounts)",
					{ connectionId, rawAccountCount: bankAccountsData?.length ?? 0 }
				);
				const { error: touchError } = await supabase
					.from("bank_connections")
					.update({
						status: "connected",
						last_synced_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					})
					.eq("id", connectionId);
				if (touchError) {
					logger.error("[syncConnection] Failed to touch connection timestamp", {
						connectionId,
						error: touchError,
					});
					throw touchError;
				}
				return {
					status: "completed" as const,
					accountsSynced: 0,
				};
			}

			logger.info("[syncConnection] Found accounts to sync", {
				connectionId,
				accountCount: filteredAccounts.length,
			});

			// Midday parity: use batchTriggerAndWait with staggered delays
			// Delay: 30s for manual sync, 60s for background sync
			const delaySeconds = manualSync ? 30 : 60;

			type BankAccountRow =
				Database["public"]["Tables"]["bank_accounts"]["Row"];

			const batchItems = (filteredAccounts as BankAccountRow[]).map(
				(account, i) => ({
					payload: {
						id: account.id,
						teamId: account.team_id,
						accountId: account.external_id ?? "",
						provider: "mono" as const,
						connectionId,
						accountType: (account.type ?? "bank") as "bank" | "momo" | "cash" | "other",
						currency: account.currency ?? undefined,
						manualSync,
					},
					options: {
						delay: `${i * delaySeconds}s`,
						tags: ctx.run.tags,
					},
				})
			);

			// Batch trigger all account syncs with staggered delays
			await syncAccount.batchTriggerAndWait(batchItems);

			// Update connection status and lastSyncedAt
			// Midday parity: use Supabase client
			const { error: connectionUpdateError } = await supabase
				.from("bank_connections")
				.update({
					status: "connected",
					last_synced_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", connectionId);
			if (connectionUpdateError) {
				logger.error("[syncConnection] Connection update failed", {
					connectionId,
					error: connectionUpdateError,
				});
				throw connectionUpdateError;
			}

			logger.info("[syncConnection] Sync completed", {
				connectionId,
				accountsSynced: filteredAccounts.length,
			});

			return {
				status: "completed" as const,
				accountsSynced: filteredAccounts.length,
			};
		} catch (error) {
			logger.error("[syncConnection] Sync failed", {
				connectionId,
				error: error instanceof Error ? error.message : String(error),
			});

			// Update connection with error status
			// Midday parity: use Supabase client
			const { error: errUpdateError } = await supabase
				.from("bank_connections")
				.update({
					status: "error",
					updated_at: new Date().toISOString(),
				})
				.eq("id", connectionId);
			if (errUpdateError) {
				logger.error("[syncConnection] Failed to persist error status", {
					connectionId,
					error: errUpdateError,
				});
			}

			throw error;
		}
	},
});
