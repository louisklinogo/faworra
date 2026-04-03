import { relations, sql } from "drizzle-orm";
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
export const teamInviteStatus = pgEnum("team_invite_status", [
	"pending",
	"accepted",
	"revoked",
	"expired",
]);

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

export const teamMemberships = pgTable(
	"team_memberships",
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
		index("team_memberships_user_id_idx").on(table.userId),
		index("team_memberships_team_id_idx").on(table.teamId),
		uniqueIndex("team_memberships_user_id_team_id_idx").on(
			table.userId,
			table.teamId
		),
	]
);

export const teamInvites = pgTable(
	"team_invites",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		normalizedEmail: text("normalized_email").notNull(),
		role: teamRole("role").notNull(),
		status: teamInviteStatus("status").default("pending").notNull(),
		tokenHash: text("token_hash").notNull().unique(),
		invitedByUserId: text("invited_by_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		acceptedByUserId: text("accepted_by_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		expiresAt: timestamp("expires_at").notNull(),
		acceptedAt: timestamp("accepted_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("team_invites_team_id_idx").on(table.teamId),
		index("team_invites_normalized_email_idx").on(table.normalizedEmail),
		uniqueIndex("team_invites_pending_team_id_normalized_email_idx")
			.on(table.teamId, table.normalizedEmail)
			.where(sql`${table.status} = 'pending'::team_invite_status`),
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
	members: many(teamMemberships),
	invites: many(teamInvites),
	settings: one(teamSettings),
}));

export const teamMembershipsRelations = relations(
	teamMemberships,
	({ one }) => ({
		user: one(user, {
			fields: [teamMemberships.userId],
			references: [user.id],
		}),
		team: one(teams, {
			fields: [teamMemberships.teamId],
			references: [teams.id],
		}),
	})
);

export const teamInvitesRelations = relations(teamInvites, ({ one }) => ({
	team: one(teams, {
		fields: [teamInvites.teamId],
		references: [teams.id],
	}),
	invitedByUser: one(user, {
		fields: [teamInvites.invitedByUserId],
		references: [user.id],
	}),
	acceptedByUser: one(user, {
		fields: [teamInvites.acceptedByUserId],
		references: [user.id],
	}),
}));

export const teamSettingsRelations = relations(teamSettings, ({ one }) => ({
	team: one(teams, {
		fields: [teamSettings.teamId],
		references: [teams.id],
	}),
}));
