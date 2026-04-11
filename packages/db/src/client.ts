import { env } from "@faworra-new/env/server";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type {
	NodePgDatabase,
	NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
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

// Use NodePgDatabase type which matches what drizzle returns
export type Database = NodePgDatabase<typeof schema> & { $client: Pool };

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
 * Reference: midday/packages/supabase/src/job-client.ts
 *
 * Use this for document processing tasks (not banking - banking uses Supabase client)
 */
export const createJobDb = () => {
	const jobPool = new Pool({
		connectionString: env.DATABASE_PRIMARY_POOLER_URL ?? env.DATABASE_URL,
		max: 1, // Single connection per job
		idleTimeoutMillis: 60_000,
		connectionTimeoutMillis: 15_000,
		allowExitOnIdle: true,
	});

	const jobDb = drizzle(jobPool, {
		schema,
		casing: "snake_case",
	});

	return {
		db: jobDb as Database,
		disconnect: () => jobPool.end(),
	};
};
