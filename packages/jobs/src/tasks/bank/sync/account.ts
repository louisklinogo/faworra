/**
 * Sync bank account transactions and balance
 * Midday parity: sync a single bank account with provider
 * 
 * Reference: midday/packages/jobs/src/tasks/bank/sync/account.ts
 */

import { syncAccountSchema } from "../../../schema";
import { bankAccounts, transactions, db, eq } from "@faworra-new/db";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { MonoProvider } from "@faworra-new/banking";

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
			const [bankAccount] = await db
				.select()
				.from(bankAccounts)
				.where(eq(bankAccounts.id, id))
				.limit(1);

			if (!bankAccount) {
				logger.error("[syncAccount] Bank account not found", { id });
				throw new Error("Bank account not found");
			}

			// Determine date range for sync
			let fromDate: string | undefined;
			if (bankAccount.lastSyncedAt) {
				fromDate = bankAccount.lastSyncedAt.toISOString().split("T")[0];
			}

			// ─── Get Balance from Mono ────────────────────────────────────
			try {
				const balance = await monoProvider.getAccountBalance({
					accountId,
				});

				// Update balance in database
				await db
					.update(bankAccounts)
					.set({
						balance: balance.current,
						availableBalance: balance.available,
						creditLimit: balance.creditLimit ?? null,
						syncStatus: "available",
						lastSyncedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(bankAccounts.id, id));

				logger.info("[syncAccount] Updated balance", {
					id,
					balance: balance.current,
					currency: balance.currency,
				});
			} catch (balanceError) {
				logger.error("[syncAccount] Failed to get balance", {
					id,
					error: balanceError instanceof Error ? balanceError.message : String(balanceError),
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
					logger.info("[syncAccount] No transactions to upsert", { id, accountId });
					return {
						status: "completed" as const,
						transactionsSynced: 0,
					};
				}

				// Transform and upsert transactions in batches
				let upsertedCount = 0;
				for (let i = 0; i < result.transactions.length; i += BATCH_SIZE) {
					const batch = result.transactions.slice(i, i + BATCH_SIZE);
					
					for (const tx of batch) {
						await db
							.insert(transactions)
							.values({
								id: tx.id,
								teamId,
								bankAccountId: id,
								internalId: tx.internalId ?? tx.id,
								name: tx.name ?? "Unknown",
								amount: tx.amount,
								currency: currency ?? "GHS",
								description: tx.description,
								transactionDate: new Date(tx.date),
								status: "posted",
								method: "other",
								manual: false,
								createdAt: new Date(),
								updatedAt: new Date(),
							})
							.onConflictDoUpdate({
								target: [transactions.teamId, transactions.internalId],
								set: {
									name: tx.name ?? "Unknown",
									amount: tx.amount,
									description: tx.description ?? null,
									updatedAt: new Date(),
								},
							});
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
			await db
				.update(bankAccounts)
				.set({
					syncStatus: "failed",
					updatedAt: new Date(),
				})
				.where(eq(bankAccounts.id, id));

			throw error;
		}
	},
});
