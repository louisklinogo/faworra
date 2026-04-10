/**
 * Sync bank connection
 * Midday parity: fan-out pattern - sync all accounts for a connection
 * 
 * Reference: midday/packages/jobs/src/tasks/bank/sync/connection.ts
 */

import { syncConnectionSchema } from "./../../../schema";
import { bankAccounts, bankConnections, eq, and, db } from "@faworra-new/db";
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
	run: async ({ connectionId, teamId, manualSync }) => {
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

			// Check if connection is still valid
			if (connection.status === "disconnected" || connection.status === "error") {
				logger.warn("[syncConnection] Connection is not active", { 
					connectionId, 
					status: connection.status 
				});
				return {
					status: "skipped" as const,
					reason: `Connection is ${connection.status}`,
				};
			}

			// Get all enabled bank accounts for this connection
			const accounts = await db
				.select()
				.from(bankAccounts)
				.where(
					and(
						eq(bankAccounts.bankConnectionId, connectionId),
						eq(bankAccounts.enabled, true),
						eq(bankAccounts.manual, false)
					)
				);

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

			// Trigger sync for each account
			for (const account of accounts) {
				await syncAccount.triggerAndWait({
					id: account.id,
					teamId: account.teamId,
					accountId: account.externalId ?? "",
					provider: "mono",
					connectionId,
					accountType: account.type === "momo" ? "depository" : "depository",
					currency: account.currency,
					manualSync,
				});
			}

			// Update connection lastSyncedAt
			await db
				.update(bankConnections)
				.set({ 
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
