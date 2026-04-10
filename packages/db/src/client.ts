import { env } from "@faworra-new/env/server";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { Pool } from "pg";

import * as schema from "./schema";

const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: 10,
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, {
	schema,
	casing: "snake_case",
});

export const connectDb = async () => {
	return db;
};

export type Database = Awaited<ReturnType<typeof connectDb>>;

export type TransactionClient = PgTransaction<
	NodePgQueryResultHKT,
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>;

/** Use in query functions that should work both standalone and within transactions */
export type DatabaseOrTransaction = Database | TransactionClient;

/**
 * Create a job-specific database connection
 * Midday parity: creates fresh connection per job run for optimal pooling
 * Used by packages/jobs/src/init.ts middleware
 */
export function createJobDb() {
	// Create a dedicated pool for this job run
	// In production, this would use Supabase session pooler
	const jobPool = new Pool({
		connectionString: env.DATABASE_URL,
		max: 2, // Minimal for job execution
		idleTimeoutMillis: 10_000,
		connectionTimeoutMillis: 5000,
	});

	return drizzle(jobPool, {
		schema,
		casing: "snake_case",
	});
}
