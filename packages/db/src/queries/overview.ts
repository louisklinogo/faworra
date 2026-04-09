import { eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { transactions } from "../schema/financial";

export interface OverviewSummary {
	expenseTotal: number;
	incomeTotal: number;
	netTotal: number;
	transactionCount: number;
}

export const getOverviewSummary = async (db: Database, { teamId }: { teamId: string }) => {
	const [summary] = await db
		.select({
			expenseTotal: sql<number>`COALESCE(ABS(SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)), 0)`,
			incomeTotal: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
			netTotal: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
			transactionCount: sql<number>`COUNT(*)`,
		})
		.from(transactions)
		.where(eq(transactions.teamId, teamId));

	return {
		expenseTotal: Number(summary?.expenseTotal ?? 0),
		incomeTotal: Number(summary?.incomeTotal ?? 0),
		netTotal: Number(summary?.netTotal ?? 0),
		transactionCount: Number(summary?.transactionCount ?? 0),
	};
};
