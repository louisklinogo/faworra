import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const teamRole = pgEnum("team_role", ["owner", "member"]);

export const teams = pgTable("teams", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	logoUrl: text("logo_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const usersOnTeam = pgTable(
	"users_on_team",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		role: teamRole("role").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("users_on_team_user_id_idx").on(table.userId),
		index("users_on_team_team_id_idx").on(table.teamId),
		uniqueIndex("users_on_team_user_id_team_id_idx").on(
			table.userId,
			table.teamId
		),
	]
);

export const teamSettings = pgTable("team_settings", {
	teamId: uuid("team_id")
		.primaryKey()
		.references(() => teams.id, { onDelete: "cascade" }),
	baseCurrency: text("base_currency"),
	countryCode: text("country_code"),
	fiscalYearStartMonth: integer("fiscal_year_start_month"),
	industryKey: text("industry_key"),
	industryConfigVersion: text("industry_config_version"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const teamsRelations = relations(teams, ({ many, one }) => ({
	members: many(usersOnTeam),
	settings: one(teamSettings),
}));

export const usersOnTeamRelations = relations(usersOnTeam, ({ one }) => ({
	user: one(user, {
		fields: [usersOnTeam.userId],
		references: [user.id],
	}),
	team: one(teams, {
		fields: [usersOnTeam.teamId],
		references: [teams.id],
	}),
}));

export const teamSettingsRelations = relations(teamSettings, ({ one }) => ({
	team: one(teams, {
		fields: [teamSettings.teamId],
		references: [teams.id],
	}),
}));
