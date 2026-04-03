import { env } from "@faworra-new/env/server";
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
import { userContext, userContextRelations } from "./schema/core";
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
	user,
	userContext,
	userContextRelations,
	userRelations,
	verification,
};

export const db = drizzle(env.DATABASE_URL, { schema });
