import { env } from "@faworra-new/env/server";
import { and as drizzleAnd, eq as drizzleEq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

import {
	account,
	accountRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
} from "./schema/auth";
import {
	userContextRelations,
	userContext as userContextSchema,
} from "./schema/core";
import {
	transactionCategories,
	transactionCategoriesRelations,
	transactionKind,
	transactions,
	transactionsRelations,
} from "./schema/financial";
import {
	teamInviteStatus,
	teamInvites,
	teamInvitesRelations,
	teamMemberships,
	teamMembershipsRelations,
	teamRole,
	teamSettings,
	teamSettingsRelations,
	teams,
	teamsRelations,
} from "./schema/team";

// Drizzle query predicates exported as named constants so dependent packages
// can reach them through the @faworra-new/db boundary without a direct
// drizzle-orm dependency. Named const bindings (rather than re-export syntax)
// let Bun resolve these exports statically in test environments.
export const and = drizzleAnd;
export const eq = drizzleEq;

const schema = {
	account,
	accountRelations,
	session,
	sessionRelations,
	teams,
	teamsRelations,
	teamInviteStatus,
	teamInvites,
	teamInvitesRelations,
	teamMemberships,
	teamMembershipsRelations,
	teamRole,
	teamSettings,
	teamSettingsRelations,
	transactionCategories,
	transactionCategoriesRelations,
	transactionKind,
	transactions,
	transactionsRelations,
	user,
	userContext: userContextSchema,
	userContextRelations,
	userRelations,
	verification,
};

export const db = drizzle(env.DATABASE_URL, { schema });
