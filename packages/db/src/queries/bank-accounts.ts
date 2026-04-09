import { asc, eq } from "drizzle-orm";
import type { Database } from "../client";

export const getBankAccounts = (
	db: Database,
	{ teamId }: { teamId: string }
) => {
	return db.query.bankAccounts.findMany({
		orderBy: (table) => [asc(table.name)],
		where: (table) => eq(table.teamId, teamId),
	});
};
