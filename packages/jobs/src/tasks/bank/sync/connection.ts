/**
 * Sync bank connection
 * Midday parity: fan-out pattern - sync all accounts for a connection
 * 
 * Reference: midday/packages/jobs/src/tasks/bank/sync/connection.ts
 */

import { syncConnectionSchema } from "./../../../schema";
import { bankAccounts, bankConnections, eq, and } from "@faworra-new/db";
import { getDb } from "./../../../init";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { sql } from "drizzle-orm";
import { syncAccount } from "./account";

// Fan-out pattern. We want to trigger a task for each bank account (Transactions, Balance)
export const syncConnection = schemaTask({
	id: "sync-connection",
	maxDuration: 120,
	retry: {
		maxAttempts: 2,
	},
	schema: syncConnectionSchema,
	run: async ({ connectionId, teamId, manualSync }, { ctx }) => {
		const db = getDb();
		
		logger.info("[syncConnection] Starting sync", { connectionId, teamId, manualSync });

		try {
			// Get bank connection
			const [connection] = await db
				.select()
				.from(bankConnections)
				.where(eq(bankConnections.id, connectionId))
				.limit(1);

			if (!connection) {
				logger.error("[syncConnection] Connection not found", { connectionId });
				throw new Error("Connection not found");
			}

			// Get all enabled bank accounts for this connection
			// Midday pattern: skip accounts with 3+ error retries during background sync
			const accountsQuery = db
				.select()
				.from(bankAccounts)
				.where(
					and(
						eq(bankAccounts.bankConnectionId, connectionId),
						eq(bankAccounts.enabled, true),
						eq(bankAccounts.manual, false)
					)
				);

			const accounts = await accountsQuery;

			if (accounts.length === 0) {
				logger.info("[syncConnection] No enabled accounts found", { connectionId });
				return {
					status: "completed" as const,
					accountsSynced: 0,
				};
			}

			logger.info("[syncConnection] Found accounts to sync", { 
				connectionId,
				accountCount: accounts.length 
			});

			// Midday parity: use batchTriggerAndWait with staggered delays
			// Delay: 30s for manual sync, 60s for background sync
			const delaySeconds = manualSync ? 30 : 60;
			
			const batchItems = accounts.map((account: typeof accounts[0], i: number) => ({
				payload: {
					id: account.id,
					teamId: account.teamId,
					accountId: account.externalId ?? "",
					provider: "mono" as const,
					connectionId,
					accountType: "depository" as const,
					currency: account.currency ?? undefined,
					manualSync,
				},
				options: {
					delay: `${i * delaySeconds}s`,
					tags: ctx.run.tags,
				},
			}));

			// Batch trigger all account syncs with staggered delays
			await syncAccount.batchTriggerAndWait(batchItems);

			// Update connection lastSyncedAt and status
			await db
				.update(bankConnections)
				.set({ 
					status: "connected",
					lastSyncedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(bankConnections.id, connectionId));

			logger.info("[syncConnection] Sync completed", { 
				connectionId,
				accountsSynced: accounts.length 
			});

			return {
				status: "completed" as const,
				accountsSynced: accounts.length,
			};
		} catch (error) {
			logger.error("[syncConnection] Sync failed", {
				connectionId,
				error: error instanceof Error ? error.message : String(error),
			});
			
			// Update connection with error status
			await db
				.update(bankConnections)
				.set({
					status: "error",
					errorCount: sql`${bankConnections.errorCount} + 1`,
					updatedAt: new Date(),
				})
				.where(eq(bankConnections.id, connectionId));

			throw error;
		}
	},
});
