import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/schema";
import { transactionCategories, teams } from "../src/schema";
import { eq, and } from "drizzle-orm";
import "dotenv/config";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function main() {
	const teamId = process.argv[2];

	if (!teamId) {
		console.log("Finding teams...");
		const allTeams = await db.select().from(teams);
		console.log("\nAvailable teams:");
		for (const t of allTeams) {
			console.log(`  ${t.name}: ${t.id}`);
		}
		console.log("\nUsage: bun run scripts/reseed-categories.ts <team_id>");
		await pool.end();
		process.exit(1);
	}

	console.log(`\nDeleting system categories for team ${teamId}...`);
	const deleted = await db
		.delete(transactionCategories)
		.where(
			and(
				eq(transactionCategories.teamId, teamId),
				eq(transactionCategories.system, true),
			),
		)
		.returning();

	console.log(`Deleted ${deleted.length} categories`);
	console.log(
		"\n✓ Refresh the categories page in the app to re-seed with correct parent-child relationships.",
	);

	await pool.end();
}

main().catch(console.error);
