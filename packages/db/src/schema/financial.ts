import { relations, sql } from "drizzle-orm";
import {
	boolean,
	customType,
	foreignKey,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	real,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { teams } from "./team";

// ─── Custom Types ────────────────────────────────────────────────────────────

// Midday pattern: numeric type with precision/scale for financial values
// Driver returns string, we parse to number
type NumericConfig = {
	precision?: number;
	scale?: number;
};

export const numericCasted = customType<{
	data: number;
	driverData: string;
	config: NumericConfig;
}>({
	dataType: (config) => {
		if (config?.precision && config?.scale) {
			return `numeric(${config.precision}, ${config.scale})`;
		}
		return "numeric";
	},
	fromDriver: (value: string) => Number.parseFloat(value),
	toDriver: (value: number) => value.toString(),
});

// ─── Enums ────────────────────────────────────────────────────────────────────

// Note: transactionKind enum removed - income/expense now determined by amount sign
// (Midday pattern): amount > 0 = income, amount < 0 = expense

export const transactionStatus = pgEnum("transaction_status", [
	"posted",
	"pending",
	"excluded",
	"completed",
	"archived",
	"exported",
]);

export const transactionMethod = pgEnum("transaction_method", [
	"payment",
	"card_purchase",
	"card_atm",
	"transfer",
	"other",
	"unknown",
	"ach",
	"interest",
	"deposit",
	"wire",
	"fee",
	"momo", // Mobile Money - African specific
	"cash",
]);

export const transactionFrequency = pgEnum("transaction_frequency", [
	"weekly",
	"biweekly",
	"monthly",
	"semi_monthly",
	"annually",
	"irregular",
	"unknown",
]);

// Accounting sync enums (for export to Xero, QuickBooks, etc.)
export const accountingProviderEnum = pgEnum("accounting_provider", [
	"xero",
	"quickbooks",
	"fortnox",
]);

export const accountingSyncStatusEnum = pgEnum("accounting_sync_status", [
	"synced",
	"failed",
	"pending",
	"partial",
]);

export const accountingSyncTypeEnum = pgEnum("accounting_sync_type", [
	"auto",
	"manual",
]);

// Inbox enums (for receipt/document ingestion)
export const inboxStatusEnum = pgEnum("inbox_status", [
	"processing",
	"pending",
	"archived",
	"new",
	"analyzing",
]);

export const bankConnectionStatus = pgEnum("bank_connection_status", [
	"connected",
	"disconnected",
	"error",
]);

// Bank connection detail status (provider-specific)
export const bankConnectionDetailStatus = pgEnum(
	"bank_connection_detail_status",
	["linked", "processing", "available", "partial", "unavailable", "expired", "failed"]
);

// Sync status for bank accounts
export const bankAccountSyncStatus = pgEnum("bank_account_sync_status", [
	"pending",
	"syncing",
	"available",
	"failed",
]);

export const bankAccountType = pgEnum("bank_account_type", [
	"bank",
	"momo", // Mobile Money (MoMo) — African SME specific
	"cash",
	"other",
]);

// ─── Bank Connections ─────────────────────────────────────────────────────────

export const bankConnections = pgTable(
	"bank_connections",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		institutionName: text("institution_name"),
		// Provider tracking (Midday parity)
		provider: text("provider").notNull().default("mono"), // 'mono' for Phase 1
		enrollmentId: text("enrollment_id"), // Provider's enrollment/linking ID
		status: bankConnectionStatus("status").default("connected").notNull(),
		detailStatus: bankConnectionDetailStatus("detail_status"), // Data availability status
		errorCount: integer("error_count").default(0),
		lastSyncedAt: timestamp("last_synced_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("bank_connections_team_id_idx").on(table.teamId)]
);

// ─── Bank Accounts ────────────────────────────────────────────────────────────

export const bankAccounts = pgTable(
	"bank_accounts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		bankConnectionId: uuid("bank_connection_id").references(
			() => bankConnections.id,
			{ onDelete: "set null" }
		),
		name: text("name").notNull(),
		currency: text("currency").notNull(),
		type: bankAccountType("type").default("bank").notNull(),
		accountNumber: text("account_number"),
		enabled: boolean("enabled").default(true).notNull(),
		manual: boolean("manual").default(true).notNull(),
		// Provider mapping (Midday parity)
		externalId: text("external_id"), // Mono's account ID
		// Balance snapshot
		balance: integer("balance"), // Current balance in minor units
		availableBalance: integer("available_balance"), // Available balance in minor units
		creditLimit: integer("credit_limit"), // For credit accounts
		// Sync tracking
		lastSyncedAt: timestamp("last_synced_at"),
		syncStatus: bankAccountSyncStatus("sync_status").default("pending"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("bank_accounts_team_id_idx").on(table.teamId),
		index("bank_accounts_connection_id_idx").on(table.bankConnectionId),
	]
);

// ─── Transaction Categories ───────────────────────────────────────────────────

// Aligned with Midday schema pattern:
// - Composite primary key (teamId, slug) instead of UUID PK
// - parentId (UUID self-ref) instead of parentSlug for FK integrity
// - No 'kind' field - income/expense determined by amount sign
// - numericCasted for taxRate (proper financial precision)
export const transactionCategories = pgTable(
	"transaction_categories",
	{
		id: uuid("id").defaultRandom().notNull().unique(),
		name: text("name").notNull(),
		teamId: uuid("team_id").notNull(),
		color: text("color"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		system: boolean("system").default(false),
		slug: text("slug"), // Generated in database
		taxRate: numericCasted("tax_rate", { precision: 10, scale: 2 }),
		taxType: text("tax_type"),
		taxReportingCode: text("tax_reporting_code"),
		excluded: boolean("excluded").default(false),
		description: text("description"),
		parentId: uuid("parent_id"),
	},
	(table) => [
		index("transaction_categories_team_id_idx").using(
			"btree",
			table.teamId.asc().nullsLast()
		),
		index("transaction_categories_parent_id_idx").using(
			"btree",
			table.parentId.asc().nullsLast()
		),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "transaction_categories_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "transaction_categories_parent_id_fkey",
		}).onDelete("set null"),
		primaryKey({
			columns: [table.teamId, table.slug],
			name: "transaction_categories_pkey",
		}),
		unique("unique_team_slug").on(table.teamId, table.slug),
	]
);

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = pgTable(
	"tags",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		color: text("color"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("tags_team_id_idx").on(table.teamId),
		uniqueIndex("tags_team_id_slug_idx").on(table.teamId, table.slug),
	]
);

// ─── Transaction Tags (Junction Table) ───────────────────────────────────────

export const transactionTags = pgTable(
	"transaction_tags",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		transactionId: uuid("transaction_id")
			.notNull()
			.references(() => transactions.id, { onDelete: "cascade" }),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("transaction_tags_team_id_idx").on(table.teamId),
		index("transaction_tags_transaction_id_idx").on(table.transactionId),
		index("transaction_tags_tag_id_idx").on(table.tagId),
		uniqueIndex("transaction_tags_unique_idx").on(
			table.transactionId,
			table.tagId
		),
	]
);

// ─── Transaction Attachments ─────────────────────────────────────────────────

export const transactionAttachments = pgTable(
	"transaction_attachments",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		transactionId: uuid("transaction_id")
			.notNull()
			.references(() => transactions.id, { onDelete: "cascade" }),
		filename: text("filename").notNull(),
		path: text("path").notNull(), // Storage path in Supabase/S3
		mimeType: text("mime_type").notNull(),
		size: integer("size").notNull(), // Size in bytes
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("transaction_attachments_team_id_idx").on(table.teamId),
		index("transaction_attachments_transaction_id_idx").on(table.transactionId),
	]
);

// ─── Accounting Sync Records ───────────────────────────────────────────────────
// Tracks export to accounting software (Xero, QuickBooks, etc.)

export const accountingSyncRecords = pgTable(
	"accounting_sync_records",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		transactionId: uuid("transaction_id")
			.notNull()
			.references(() => transactions.id, { onDelete: "cascade" }),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		provider: accountingProviderEnum().notNull(),
		providerTenantId: text("provider_tenant_id").notNull(),
		providerTransactionId: text("provider_transaction_id"),
		// Maps Faworra attachment IDs to provider attachment IDs for sync tracking
		syncedAttachmentMapping: jsonb("synced_attachment_mapping")
			.default(sql`'{}'::jsonb`)
			.notNull()
			.$type<Record<string, string | null>>(),
		syncedAt: timestamp("synced_at").defaultNow().notNull(),
		syncType: accountingSyncTypeEnum("sync_type"),
		status: accountingSyncStatusEnum().default("synced").notNull(),
		errorMessage: text("error_message"),
		errorCode: text("error_code"),
		providerEntityType: text("provider_entity_type"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("idx_accounting_sync_transaction").on(table.transactionId),
		index("idx_accounting_sync_team_provider").on(table.teamId, table.provider),
		index("idx_accounting_sync_status").on(table.teamId, table.status),
		uniqueIndex("accounting_sync_records_transaction_provider_key").on(
			table.transactionId,
			table.provider
		),
	]
);

// ─── Inbox ─────────────────────────────────────────────────────────────────────
// Stores incoming documents/receipts that can be matched to transactions

export const inbox = pgTable(
	"inbox",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
		filePath: text("file_path").array(),
		fileName: text("file_name"),
		transactionId: uuid("transaction_id").references(() => transactions.id, {
			onDelete: "set null",
		}),
		amount: integer("amount"),
		currency: text("currency"),
		contentType: text("content_type"),
		size: integer("size"),
		attachmentId: uuid("attachment_id"),
		date: text("date"),
		status: inboxStatusEnum().default("new"),
		senderEmail: text("sender_email"),
		displayName: text("display_name"),
	},
	(table) => [
		index("inbox_team_id_idx").on(table.teamId),
		index("inbox_transaction_id_idx").on(table.transactionId),
		index("inbox_status_idx").on(table.status),
	]
);

// ─── Transaction Match Suggestions ─────────────────────────────────────────────
// AI-powered receipt matching suggestions

export const transactionMatchSuggestions = pgTable(
	"transaction_match_suggestions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		inboxId: uuid("inbox_id")
			.notNull()
			.references(() => inbox.id, { onDelete: "cascade" }),
		transactionId: uuid("transaction_id")
			.notNull()
			.references(() => transactions.id, { onDelete: "cascade" }),
		confidenceScore: real("confidence_score").notNull(),
		amountScore: real("amount_score"),
		currencyScore: real("currency_score"),
		dateScore: real("date_score"),
		nameScore: real("name_score"),
		matchType: text("match_type").notNull(), // 'auto_matched', 'high_confidence', 'suggested'
		matchDetails: jsonb("match_details"),
		status: text("status").default("pending").notNull(), // 'pending', 'confirmed', 'declined', 'expired', 'unmatched'
		userActionAt: timestamp("user_action_at"),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	},
	(table) => [
		index("transaction_match_suggestions_inbox_id_idx").on(table.inboxId),
		index("transaction_match_suggestions_transaction_id_idx").on(
			table.transactionId
		),
		index("transaction_match_suggestions_team_id_idx").on(table.teamId),
		index("transaction_match_suggestions_status_idx").on(table.status),
		uniqueIndex("transaction_match_suggestions_unique").on(
			table.inboxId,
			table.transactionId
		),
	]
);

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = pgTable(
	"transactions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, {
			onDelete: "set null",
		}),
		// Category reference (slug-based like Midday)
		categorySlug: text("category_slug"),
		// Assigned user for task management
		assignedId: text("assigned_id"),
		// Bank sync idempotency key
		internalId: text("internal_id").notNull(),
		// Transaction name/title
		name: text("name").notNull(),
		// Amount in minor units (e.g., pesewas for GHS)
		amount: integer("amount").notNull(),
		currency: text("currency").notNull(),
		// Multi-currency support
		baseAmount: integer("base_amount"), // Amount in base currency
		baseCurrency: text("base_currency"), // Team's base currency
		// Transaction details
		description: text("description"),
		note: text("note"),
		// income/expense determined by amount sign (Midday pattern)
		// amount > 0 = income, amount < 0 = expense
		method: transactionMethod("method").default("other").notNull(),
		status: transactionStatus("status").default("posted").notNull(),
		// Counterparty
		counterpartyName: text("counterparty_name"),
		// Tax fields
		taxAmount: integer("tax_amount"), // Tax amount in minor units
		taxRate: real("tax_rate"), // Tax rate as percentage
		taxType: text("tax_type"), // e.g., "VAT", "NHIL"
		// Running balance
		balance: integer("balance"), // Account balance at transaction time
		// Flags
		internal: boolean("internal").default(false).notNull(), // exclude from reports
		manual: boolean("manual").default(true).notNull(), // user-created vs bank sync
		notified: boolean("notified").default(false).notNull(), // notification sent
		// Recurring transaction detection
		recurring: boolean("recurring").default(false),
		frequency: transactionFrequency("frequency"),
		// AI enrichment
		merchantName: text("merchant_name"),
		enrichmentCompleted: boolean("enrichment_completed").default(false),
		// Dates
		transactionDate: timestamp("transaction_date").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("transactions_team_id_idx").on(table.teamId),
		index("transactions_bank_account_id_idx").on(table.bankAccountId),
		index("transactions_category_slug_idx").on(table.categorySlug),
		index("transactions_transaction_date_idx").on(table.transactionDate),
		index("transactions_assigned_id_idx").on(table.assignedId),
		index("transactions_internal_id_idx").on(table.internalId),
		index("transactions_counterparty_name_idx").on(table.counterpartyName),
		uniqueIndex("transactions_team_internal_id_idx").on(
			table.teamId,
			table.internalId
		),
	]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const bankConnectionsRelations = relations(
	bankConnections,
	({ one, many }) => ({
		team: one(teams, {
			fields: [bankConnections.teamId],
			references: [teams.id],
		}),
		accounts: many(bankAccounts),
	})
);

export const bankAccountsRelations = relations(
	bankAccounts,
	({ one, many }) => ({
		team: one(teams, {
			fields: [bankAccounts.teamId],
			references: [teams.id],
		}),
		connection: one(bankConnections, {
			fields: [bankAccounts.bankConnectionId],
			references: [bankConnections.id],
		}),
		transactions: many(transactions),
	})
);

export const transactionCategoriesRelations = relations(
	transactionCategories,
	({ many, one }) => ({
		team: one(teams, {
			fields: [transactionCategories.teamId],
			references: [teams.id],
		}),
		parent: one(transactionCategories, {
			fields: [transactionCategories.parentId],
			references: [transactionCategories.id],
			relationName: "parent_child",
		}),
		children: many(transactionCategories, {
			relationName: "parent_child",
		}),
		transactions: many(transactions),
	})
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
	team: one(teams, {
		fields: [tags.teamId],
		references: [teams.id],
	}),
	transactionTags: many(transactionTags),
}));

export const transactionTagsRelations = relations(
	transactionTags,
	({ one }) => ({
		transaction: one(transactions, {
			fields: [transactionTags.transactionId],
			references: [transactions.id],
		}),
		tag: one(tags, {
			fields: [transactionTags.tagId],
			references: [tags.id],
		}),
		team: one(teams, {
			fields: [transactionTags.teamId],
			references: [teams.id],
		}),
	})
);

export const transactionsRelations = relations(
	transactions,
	({ one, many }) => ({
		category: one(transactionCategories, {
			fields: [transactions.categorySlug],
			references: [transactionCategories.slug],
			relationName: "category_slug",
		}),
		bankAccount: one(bankAccounts, {
			fields: [transactions.bankAccountId],
			references: [bankAccounts.id],
		}),
		team: one(teams, {
			fields: [transactions.teamId],
			references: [teams.id],
		}),
		assignedUser: one(user, {
			fields: [transactions.assignedId],
			references: [user.id],
		}),
		attachments: many(transactionAttachments),
		tags: many(transactionTags),
		accountingSyncRecords: many(accountingSyncRecords),
		matchSuggestions: many(transactionMatchSuggestions),
	})
);

export const transactionAttachmentsRelations = relations(
	transactionAttachments,
	({ one }) => ({
		transaction: one(transactions, {
			fields: [transactionAttachments.transactionId],
			references: [transactions.id],
		}),
		team: one(teams, {
			fields: [transactionAttachments.teamId],
			references: [teams.id],
		}),
	})
);

export const accountingSyncRecordsRelations = relations(
	accountingSyncRecords,
	({ one }) => ({
		transaction: one(transactions, {
			fields: [accountingSyncRecords.transactionId],
			references: [transactions.id],
		}),
		team: one(teams, {
			fields: [accountingSyncRecords.teamId],
			references: [teams.id],
		}),
	})
);

export const inboxRelations = relations(inbox, ({ one, many }) => ({
	team: one(teams, {
		fields: [inbox.teamId],
		references: [teams.id],
	}),
	transaction: one(transactions, {
		fields: [inbox.transactionId],
		references: [transactions.id],
	}),
	matchSuggestions: many(transactionMatchSuggestions),
}));

export const transactionMatchSuggestionsRelations = relations(
	transactionMatchSuggestions,
	({ one }) => ({
		transaction: one(transactions, {
			fields: [transactionMatchSuggestions.transactionId],
			references: [transactions.id],
		}),
		inbox: one(inbox, {
			fields: [transactionMatchSuggestions.inboxId],
			references: [inbox.id],
		}),
		team: one(teams, {
			fields: [transactionMatchSuggestions.teamId],
			references: [teams.id],
		}),
		user: one(user, {
			fields: [transactionMatchSuggestions.userId],
			references: [user.id],
		}),
	})
);
