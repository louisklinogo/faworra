import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { teamMemberships, teams } from "./team";

export const userContext = pgTable("user_context", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	activeMembershipId: uuid("active_membership_id").references(
		() => teamMemberships.id,
		{
			onDelete: "set null",
		}
	),
	activeTeamId: uuid("active_team_id").references(() => teams.id, {
		onDelete: "set null",
	}),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const userContextRelations = relations(userContext, ({ one }) => ({
	user: one(user, {
		fields: [userContext.userId],
		references: [user.id],
	}),
	activeMembership: one(teamMemberships, {
		fields: [userContext.activeMembershipId],
		references: [teamMemberships.id],
	}),
	activeTeam: one(teams, {
		fields: [userContext.activeTeamId],
		references: [teams.id],
	}),
}));
