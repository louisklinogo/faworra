/**
 * Bank connection queries
 * Midday parity: query functions for bank_connections table
 * 
 * Reference: midday/packages/db/src/queries/bank-connections.ts
 */

import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { bankConnections, bankAccounts } from "../schema";

/**
 * Get bank connection by enrollment ID
 * Used by Mono webhook to find connection from account ID
 */
export const getBankConnectionByEnrollmentId = async (
	db: Database,
	params: { enrollmentId: string }
) => {
	return db.query.bankConnections.findFirst({
		where: eq(bankConnections.enrollmentId, params.enrollmentId),
		columns: {
			id: true,
			teamId: true,
			provider: true,
			status: true,
			createdAt: true,
		},
		with: {
			team: {
				columns: {
					id: true,
					createdAt: true,
				},
			},
		},
	});
};

/**
 * Update bank connection status
 */
export const updateBankConnectionStatus = async (
	db: Database,
	params: { 
		id: string; 
		status: "connected" | "disconnected" | "error";
		detailStatus?: "linked" | "processing" | "available" | "partial" | "unavailable" | "expired" | "failed" | null;
	}
) => {
	const [result] = await db
		.update(bankConnections)
		.set({
			status: params.status,
			detailStatus: params.detailStatus ?? null,
			updatedAt: new Date(),
		})
		.where(eq(bankConnections.id, params.id))
		.returning({ id: bankConnections.id });

	return result;
};

/**
 * Disable all bank accounts for a connection
 */
export const disableBankAccountsForConnection = async (
	db: Database,
	params: { connectionId: string }
) => {
	return db
		.update(bankAccounts)
		.set({
			enabled: false,
			updatedAt: new Date(),
		})
		.where(eq(bankAccounts.bankConnectionId, params.connectionId))
		.returning({ id: bankAccounts.id });
};
