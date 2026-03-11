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
	teamRole,
	teamSettings,
	teamSettingsRelations,
	teams,
	teamsRelations,
	usersOnTeam,
	usersOnTeamRelations,
} from "./schema/team";

const schema = {
	account,
	accountRelations,
	session,
	sessionRelations,
	teams,
	teamsRelations,
	teamRole,
	teamSettings,
	teamSettingsRelations,
	user,
	userContext,
	userContextRelations,
	userRelations,
	usersOnTeam,
	usersOnTeamRelations,
	verification,
};

export const db = drizzle(env.DATABASE_URL, { schema });
