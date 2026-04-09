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
	idleTimeoutMillis: 30000,
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


