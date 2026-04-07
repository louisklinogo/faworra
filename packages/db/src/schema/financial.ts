import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { teams } from "./team";

export const transactionKind = pgEnum("transaction_kind", [
	"income",
	"expense",
]);

export const transactionCategories = pgTable(
	"transaction_categories",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		kind: transactionKind("kind").notNull(),
		color: text("color").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("transaction_categories_team_id_idx").on(table.teamId)]
);

export const transactions = pgTable(
	"transactions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		categoryId: uuid("category_id").references(() => transactionCategories.id, {
			onDelete: "set null",
		}),
		amount: integer("amount").notNull(),
		currency: text("currency").notNull(),
		description: text("description").notNull(),
		kind: transactionKind("kind").notNull(),
		transactionDate: timestamp("transaction_date").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("transactions_team_id_idx").on(table.teamId),
		index("transactions_category_id_idx").on(table.categoryId),
		index("transactions_transaction_date_idx").on(table.transactionDate),
	]
);

export const transactionCategoriesRelations = relations(
	transactionCategories,
	({ many, one }) => ({
		team: one(teams, {
			fields: [transactionCategories.teamId],
			references: [teams.id],
		}),
		transactions: many(transactions),
	})
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
	category: one(transactionCategories, {
		fields: [transactions.categoryId],
		references: [transactionCategories.id],
	}),
	team: one(teams, {
		fields: [transactions.teamId],
		references: [teams.id],
	}),
}));
