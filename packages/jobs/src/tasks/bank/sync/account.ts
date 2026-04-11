/**
 * Sync bank account transactions and balance
 * Midday parity: sync a single bank account with provider
 *
 * Reference: midday/packages/jobs/src/tasks/bank/sync/account.ts
 * Parity mode: ADAPTED (uses Supabase client like Midday, Mono provider instead of Plaid/GoCardless)
 */

import { MonoProvider } from "@faworra-new/banking";
import { createClient } from "@faworra-new/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { syncAccountSchema } from "../../../schema";

const BATCH_SIZE = 500;

export const syncAccount = schemaTask({
	id: "sync-account",
	maxDuration: 120,
	retry: {
		maxAttempts: 2,
	},
	schema: syncAccountSchema,
	run: async ({
		id,
		teamId,
		accountId,
		connectionId,
		currency,
		manualSync,
	}) => {
		const supabase = createClient();
		const monoProvider = new MonoProvider();

		logger.info("[syncAccount] Starting sync", {
			id,
			accountId,
			teamId,
			provider: "mono",
			manualSync,
		});

		// Suppress unused warnings - these will be used in expansion
		void connectionId;
		void manualSync;

		try {
			// Get current bank account state
			// Midday parity: use Supabase client
			const { data: bankAccount, error: fetchError } = await supabase
				.from("bank_accounts")
				.select("id, last_synced_at, currency")
				.eq("id", id)
				.single()
				.throwOnError();

			if (fetchError || !bankAccount) {
				logger.error("[syncAccount] Bank account not found", { id });
				throw new Error("Bank account not found");
			}

			// Determine date range for sync
			let fromDate: string | undefined;
			if (bankAccount.last_synced_at) {
				fromDate = bankAccount.last_synced_at.split("T")[0];
			}

			// Get current currency - prefer the one passed in, then DB value
			const currentCurrency = currency ?? bankAccount.currency ?? undefined;

			// ─── Get Balance from Mono ────────────────────────────────────
			try {
				const balance = await monoProvider.getAccountBalance({
					accountId,
				});

				// Update balance in database
				// Midday parity: use Supabase client
				await supabase
					.from("bank_accounts")
					.update({
						balance: balance.current,
						available_balance: balance.available,
						credit_limit: balance.creditLimit ?? null,
						sync_status: "available",
						last_synced_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					})
					.eq("id", id);

				logger.info("[syncAccount] Updated balance", {
					id,
					balance: balance.current,
					currency: balance.currency,
				});
			} catch (balanceError) {
				logger.error("[syncAccount] Failed to get balance", {
					id,
					error:
						balanceError instanceof Error
							? balanceError.message
							: String(balanceError),
				});
				// Continue with transaction sync even if balance fails
			}

			// ─── Get Transactions from Mono ────────────────────────────────
			try {
				const result = await monoProvider.getTransactions({
					accountId,
					fromDate,
				});

				if (result.transactions.length === 0) {
					logger.info("[syncAccount] No transactions to upsert", {
						id,
						accountId,
					});
					return {
						status: "completed" as const,
						transactionsSynced: 0,
					};
				}

				// Transform transactions for upsert
				const transactionsToUpsert = result.transactions.map((tx) => ({
					id: tx.id,
					team_id: teamId,
					bank_account_id: id,
					internal_id: tx.internalId ?? tx.id,
					name: tx.name ?? "Unknown",
					amount: tx.amount,
					currency: currentCurrency ?? "GHS",
					description: tx.description ?? null,
					transaction_date: tx.date,
					status: "posted" as const,
					method: "other" as const,
					manual: false,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				}));

				// Upsert transactions in batches
				let upsertedCount = 0;
				for (let i = 0; i < transactionsToUpsert.length; i += BATCH_SIZE) {
					const batch = transactionsToUpsert.slice(i, i + BATCH_SIZE);

					// Midday parity: use Supabase client upsert
					const { error: upsertError } = await supabase
						.from("transactions")
						.upsert(batch, {
							onConflict: "team_id,internal_id",
						});

					if (upsertError) {
						logger.error("[syncAccount] Failed to upsert transaction batch", {
							id,
							batchIndex: i,
							error: upsertError,
						});
						continue;
					}

					upsertedCount += batch.length;
				}

				logger.info("[syncAccount] Transactions synced", {
					id,
					count: upsertedCount,
				});

				return {
					status: "completed" as const,
					transactionsSynced: upsertedCount,
				};
			} catch (txError) {
				logger.error("[syncAccount] Failed to sync transactions", {
					id,
					error: txError instanceof Error ? txError.message : String(txError),
				});

				throw txError;
			}
		} catch (error) {
			// Update sync status to failed
			// Midday parity: use Supabase client
			await supabase
				.from("bank_accounts")
				.update({
					sync_status: "failed",
					updated_at: new Date().toISOString(),
				})
				.eq("id", id);

			throw error;
		}
	},
});
