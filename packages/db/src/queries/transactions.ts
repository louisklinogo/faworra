import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	isNotNull,
	isNull,
	lt,
	lte,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import type { Database } from "../client";
import {
	accountingSyncRecords,
	transactionAttachments,
	transactionCategories,
	transactionMatchSuggestions,
	transactions,
} from "../schema/financial";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface CreateTransactionInput {
	amount: number;
	bankAccountId?: string | null;
	baseAmount?: number | null;
	baseCurrency?: string | null;
	categorySlug?: string | null;
	counterpartyName?: string | null;
	currency: string;
	description?: string | null;
	enrichmentCompleted?: boolean;
	frequency?:
		| "weekly"
		| "biweekly"
		| "monthly"
		| "semi_monthly"
		| "annually"
		| "irregular"
		| "unknown"
		| null;
	internal?: boolean;
	internalId: string; // Required for idempotency
	// Note: income/expense determined by amount sign (Midday pattern)
	// amount > 0 = income, amount < 0 = expense
	manual?: boolean;
	merchantName?: string | null;
	method?:
		| "payment"
		| "card_purchase"
		| "card_atm"
		| "transfer"
		| "other"
		| "unknown"
		| "ach"
		| "interest"
		| "deposit"
		| "wire"
		| "fee"
		| "momo"
		| "cash";
	name: string; // Required
	note?: string | null;
	notified?: boolean;
	recurring?: boolean | null;
	taxAmount?: number | null;
	taxRate?: number | null;
	taxType?: string | null;
	teamId: string;
	transactionDate: Date;
}

export interface UpdateTransactionInput {
	amount?: number;
	assignedId?: string | null;
	bankAccountId?: string | null;
	baseAmount?: number | null;
	baseCurrency?: string | null;
	categorySlug?: string | null;
	counterpartyName?: string | null;
	currency?: string;
	description?: string | null;
	enrichmentCompleted?: boolean;
	frequency?:
		| "weekly"
		| "biweekly"
		| "monthly"
		| "semi_monthly"
		| "annually"
		| "irregular"
		| "unknown"
		| null;
	id: string;
	internal?: boolean;
	// Note: income/expense determined by amount sign (Midday pattern)
	merchantName?: string | null;
	method?:
		| "payment"
		| "card_purchase"
		| "card_atm"
		| "transfer"
		| "other"
		| "unknown"
		| "ach"
		| "interest"
		| "deposit"
		| "wire"
		| "fee"
		| "momo"
		| "cash";
	name?: string;
	note?: string | null;
	recurring?: boolean | null;
	status?:
		| "posted"
		| "pending"
		| "excluded"
		| "completed"
		| "archived"
		| "exported";
	taxAmount?: number | null;
	taxRate?: number | null;
	taxType?: string | null;
	teamId: string;
	transactionDate?: Date;
}

export interface SetTransactionReviewStateInput {
	id: string;
	status: "excluded" | "posted";
	teamId: string;
}

export interface ListTransactionsInput {
	accounts?: string[] | null;
	amountRange?: [number, number] | null;
	assignees?: string[] | null;
	attachments?: "include" | "exclude" | null;
	categories?: string[] | null;
	cursor?: string | null;
	end?: string | null;
	/** Filter by export status: true = only exported, false = only NOT exported */
	exported?: boolean | null;
	/** Filter by fulfillment: true = ready for review (has attachments OR status=completed), false = not ready */
	fulfilled?: boolean | null;
	internal?: boolean | null;
	manual?: "include" | "exclude" | null;
	pageSize?: number;
	q?: string | null;
	recurring?: string[] | null;
	sort?: [string, "asc" | "desc"] | null;
	start?: string | null;
	// UI list filter statuses (Midday pattern)
	statuses?: Array<
		| "blank"
		| "receipt_match"
		| "in_review"
		| "export_error"
		| "exported"
		| "excluded"
		| "archived"
	> | null;
	teamId: string;
	/** Filter by type using amount sign: "expense" = amount < 0, "income" = amount > 0 (Midday pattern) */
	type?: "income" | "expense" | null;
}

interface TransactionsListCursor {
	id: string;
	transactionDate: string;
}

interface TransactionQueryColumns {
	amount: typeof transactions.amount;
	assignedId: typeof transactions.assignedId;
	bankAccountId: typeof transactions.bankAccountId;
	categorySlug: typeof transactions.categorySlug;
	currency: typeof transactions.currency;
	description: typeof transactions.description;
	frequency: typeof transactions.frequency;
	id: typeof transactions.id;
	internal: typeof transactions.internal;
	manual: typeof transactions.manual;
	note: typeof transactions.note;
	recurring: typeof transactions.recurring;
	status: typeof transactions.status;
	teamId: typeof transactions.teamId;
	transactionDate: typeof transactions.transactionDate;
}

const DEFAULT_TRANSACTIONS_LIMIT = 25;
const MAX_TRANSACTIONS_LIMIT = 100;

const encodeTransactionsCursor = (cursor: TransactionsListCursor) => {
	return Buffer.from(JSON.stringify(cursor)).toString("base64url");
};

const decodeTransactionsCursor = (
	cursor: string
): TransactionsListCursor | null => {
	try {
		const parsed = JSON.parse(
			Buffer.from(cursor, "base64url").toString("utf8")
		) as Partial<TransactionsListCursor>;

		if (
			typeof parsed.id !== "string" ||
			typeof parsed.transactionDate !== "string"
		) {
			return null;
		}

		return {
			id: parsed.id,
			transactionDate: parsed.transactionDate,
		};
	} catch {
		return null;
	}
};

export const isTransactionsCursor = (cursor: string) => {
	return decodeTransactionsCursor(cursor) !== null;
};

const buildSearchCondition = (
	table: TransactionQueryColumns,
	searchTerm: string | undefined
) => {
	if (!searchTerm) {
		return null;
	}

	return or(
		ilike(table.description, `%${searchTerm}%`),
		ilike(table.note, `%${searchTerm}%`),
		ilike(table.currency, `%${searchTerm}%`),
		ilike(table.categorySlug, `%${searchTerm}%`)
	);
};

const buildCursorCondition = (
	table: TransactionQueryColumns,
	decodedCursor: TransactionsListCursor | null
) => {
	if (!decodedCursor) {
		return null;
	}

	const cursorDate = new Date(decodedCursor.transactionDate);

	return or(
		lt(table.transactionDate, cursorDate),
		and(eq(table.transactionDate, cursorDate), lt(table.id, decodedCursor.id))
	);
};

const buildListTransactionsWhere = ({
	accounts,
	amountRange,
	assignees,
	attachments,
	categories,
	decodedCursor,
	end,
	exported,
	fulfilled,
	internal,
	type,
	manual,
	q: searchTerm,
	recurring,
	start,
	statuses,
	teamId,
	table,
}: {
	accounts?: string[] | null;
	amountRange?: [number, number] | null;
	assignees?: string[] | null;
	attachments?: "include" | "exclude" | null;
	categories?: string[] | null;
	decodedCursor: TransactionsListCursor | null;
	end?: string | null;
	exported?: boolean | null;
	fulfilled?: boolean | null;
	internal?: boolean | null;
	/** Filter by type using amount sign (Midday pattern) */
	type?: "income" | "expense" | null;
	manual?: "include" | "exclude" | null;
	q?: string | null;
	recurring?: string[] | null;
	start?: string | null;
	statuses?: Array<
		| "blank"
		| "receipt_match"
		| "in_review"
		| "export_error"
		| "exported"
		| "excluded"
		| "archived"
	> | null;
	teamId: string;
	table: TransactionQueryColumns;
}) => {
	const conditions: (SQL | undefined)[] = [eq(table.teamId, teamId)];
	const searchCondition = buildSearchCondition(table, searchTerm ?? undefined);
	const cursorCondition = buildCursorCondition(table, decodedCursor);

	if (searchCondition) {
		conditions.push(searchCondition);
	}

	// ─── Computed Conditions (Midday Pattern) ────────────────────────────────
	// These are EXISTS-based conditions for UI status filters.
	// NOTE: Using explicit raw SQL column names instead of Drizzle eq() helpers
	// because nested sql`` templates don't preserve column references properly.

	// A transaction is "fulfilled" if it has attachments OR status=completed
	const isFulfilledCondition = sql`(
		EXISTS (
			SELECT 1
			FROM ${transactionAttachments}
			WHERE "transaction_attachments"."transaction_id" = "transactions"."id"
			AND "transaction_attachments"."team_id" = ${teamId}
		) OR "transactions"."status" = 'completed'
	)`;

	// A transaction is "exported" if status=exported OR synced to accounting
	const isExportedCondition = sql`(
		"transactions"."status" = 'exported' OR EXISTS (
			SELECT 1
			FROM ${accountingSyncRecords}
			WHERE "accounting_sync_records"."transaction_id" = "transactions"."id"
			AND "accounting_sync_records"."team_id" = ${teamId}
			AND "accounting_sync_records"."status" = 'synced'
		)
	)`;

	// Has export error
	const hasExportErrorCondition = sql`EXISTS (
		SELECT 1
		FROM ${accountingSyncRecords}
		WHERE "accounting_sync_records"."transaction_id" = "transactions"."id"
		AND "accounting_sync_records"."team_id" = ${teamId}
		AND "accounting_sync_records"."status" IN ('failed', 'partial')
	)`;

	// Has pending match suggestion (for receipt_match status)
	const hasPendingSuggestionCondition = sql`EXISTS (
		SELECT 1
		FROM ${transactionMatchSuggestions}
		WHERE "transaction_match_suggestions"."transaction_id" = "transactions"."id"
		AND "transaction_match_suggestions"."team_id" = ${teamId}
		AND "transaction_match_suggestions"."status" = 'pending'
	)`;

	// Active workflow (not excluded/archived)
	const isActiveWorkflowCondition = sql`"transactions"."status" NOT IN ('excluded', 'archived')`;

	// ─── Attachments Filter ──────────────────────────────────────────────────
	if (attachments === "exclude") {
		conditions.push(sql`NOT (${isFulfilledCondition})`);
	} else if (attachments === "include") {
		conditions.push(isFulfilledCondition);
	}

	// ─── Direct Filters for exported/fulfilled ───────────────────────────────
	if (exported === true) {
		conditions.push(isExportedCondition);
	} else if (exported === false) {
		conditions.push(sql`NOT (${isExportedCondition})`);
	}

	if (fulfilled === true) {
		conditions.push(isFulfilledCondition);
	} else if (fulfilled === false) {
		conditions.push(sql`NOT (${isFulfilledCondition})`);
	}

	// ─── UI Status Filters (Computed States) ─────────────────────────────────
	// These map UI filter values to complex conditions
	if (statuses && statuses.length > 0) {
		const statusConditions: SQL[] = [];

		if (statuses.includes("blank")) {
			statusConditions.push(sql`
				(
					${isActiveWorkflowCondition}
					AND NOT (${isFulfilledCondition})
					AND NOT (${isExportedCondition})
					AND NOT (${hasExportErrorCondition})
				)
			`);
		}

		if (statuses.includes("receipt_match")) {
			statusConditions.push(sql`
				(
					${isActiveWorkflowCondition}
					AND ${hasPendingSuggestionCondition}
					AND NOT (${isFulfilledCondition})
					AND NOT (${isExportedCondition})
				)
			`);
		}

		if (statuses.includes("in_review")) {
			statusConditions.push(sql`
				(
					${isActiveWorkflowCondition}
					AND ${isFulfilledCondition}
					AND NOT (${isExportedCondition})
					AND NOT (${hasExportErrorCondition})
				)
			`);
		}

		if (statuses.includes("export_error")) {
			statusConditions.push(sql`
				(
					${isActiveWorkflowCondition}
					AND ${hasExportErrorCondition}
					AND NOT (${isExportedCondition})
				)
			`);
		}

		if (statuses.includes("exported")) {
			statusConditions.push(isExportedCondition);
		}

		if (statuses.includes("excluded")) {
			statusConditions.push(eq(table.status, "excluded"));
		}

		if (statuses.includes("archived")) {
			statusConditions.push(eq(table.status, "archived"));
		}

		if (statusConditions.length > 0) {
			conditions.push(or(...statusConditions));
		}
	} else {
		// Default: hide excluded/archived unless explicitly filtered
		conditions.push(isActiveWorkflowCondition);
	}

	// ─── Standard Filters ───────────────────────────────────────────────────
	if (categories?.length) {
		conditions.push(inArray(table.categorySlug, categories));
	}

	if (accounts?.length) {
		conditions.push(inArray(table.bankAccountId, accounts));
	}

	// Type filter using amount sign (Midday pattern)
	// expense: amount < 0, income: amount > 0
	if (type === "expense") {
		conditions.push(lt(table.amount, 0));
	} else if (type === "income") {
		conditions.push(gt(table.amount, 0));
	}

	if (internal !== null && internal !== undefined) {
		conditions.push(eq(table.internal, internal));
	}

	if (manual === "include") {
		conditions.push(eq(table.manual, true));
	} else if (manual === "exclude") {
		conditions.push(eq(table.manual, false));
	}

	// Date range (ISO strings)
	if (start) {
		const startDate = new Date(start);
		if (!Number.isNaN(startDate.getTime())) {
			conditions.push(gte(table.transactionDate, startDate));
		}
	}

	if (end) {
		const endDate = new Date(end);
		if (!Number.isNaN(endDate.getTime())) {
			conditions.push(lte(table.transactionDate, endDate));
		}
	}

	// Amount range
	if (amountRange) {
		const [min, max] = amountRange;
		if (min !== null && min !== undefined) {
			conditions.push(sql`ABS(${table.amount}) >= ${min}`);
		}
		if (max !== null && max !== undefined) {
			conditions.push(sql`ABS(${table.amount}) <= ${max}`);
		}
	}

	// Assignees filter
	if (assignees?.length) {
		conditions.push(inArray(table.assignedId, assignees));
	}

	// Recurring frequency filter
	if (recurring?.length) {
		conditions.push(
			inArray(
				table.frequency,
				recurring as (
					| "weekly"
					| "biweekly"
					| "monthly"
					| "semi_monthly"
					| "annually"
					| "irregular"
					| "unknown"
				)[]
			)
		);
	}

	if (cursorCondition) {
		conditions.push(cursorCondition);
	}

	return and(...conditions);
};

// ─── Query: Categories ────────────────────────────────────────────────────────

export const getTransactionCategories = async (
	db: Database,
	{ teamId }: { teamId: string }
) => {
	// First get all parent categories (categories with no parentId)
	const parentCategories = await db
		.select({
			id: transactionCategories.id,
			name: transactionCategories.name,
			color: transactionCategories.color,
			slug: transactionCategories.slug,
			description: transactionCategories.description,
			system: transactionCategories.system,
			taxRate: transactionCategories.taxRate,
			taxType: transactionCategories.taxType,
			taxReportingCode: transactionCategories.taxReportingCode,
			excluded: transactionCategories.excluded,
			parentId: transactionCategories.parentId,
		})
		.from(transactionCategories)
		.where(
			and(
				eq(transactionCategories.teamId, teamId),
				isNull(transactionCategories.parentId)
			)
		)
		.orderBy(
			desc(transactionCategories.system),
			asc(transactionCategories.name)
		);

	// Then get all child categories for these parents
	const childCategories = await db
		.select({
			id: transactionCategories.id,
			name: transactionCategories.name,
			color: transactionCategories.color,
			slug: transactionCategories.slug,
			description: transactionCategories.description,
			system: transactionCategories.system,
			taxRate: transactionCategories.taxRate,
			taxType: transactionCategories.taxType,
			taxReportingCode: transactionCategories.taxReportingCode,
			excluded: transactionCategories.excluded,
			parentId: transactionCategories.parentId,
		})
		.from(transactionCategories)
		.where(
			and(
				eq(transactionCategories.teamId, teamId),
				isNotNull(transactionCategories.parentId)
			)
		)
		.orderBy(asc(transactionCategories.name));

	// Group children by parentId for efficient lookup
	const childrenByParentId = new Map<string, typeof childCategories>();
	for (const child of childCategories) {
		if (child.parentId) {
			if (!childrenByParentId.has(child.parentId)) {
				childrenByParentId.set(child.parentId, []);
			}
			childrenByParentId.get(child.parentId)!.push(child);
		}
	}

	// Attach children to their parents
	return parentCategories.map((parent) => ({
		...parent,
		children: childrenByParentId.get(parent.id) || [],
	}));
};

export const getTransactionCategoryBySlug = (
	db: Database,
	{
		slug,
		teamId,
	}: {
		slug: string;
		teamId: string;
	}
) => {
	return db.query.transactionCategories.findFirst({
		where: (table, { and, eq }) =>
			and(eq(table.slug, slug), eq(table.teamId, teamId)),
	});
};

export const getTransactionCategoryById = async (
	db: Database,
	{
		id,
		teamId,
	}: {
		id: string;
		teamId: string;
	}
) => {
	// First get the category
	const [result] = await db
		.select({
			id: transactionCategories.id,
			name: transactionCategories.name,
			color: transactionCategories.color,
			slug: transactionCategories.slug,
			description: transactionCategories.description,
			system: transactionCategories.system,
			taxRate: transactionCategories.taxRate,
			taxType: transactionCategories.taxType,
			taxReportingCode: transactionCategories.taxReportingCode,
			excluded: transactionCategories.excluded,
			parentId: transactionCategories.parentId,
			createdAt: transactionCategories.createdAt,
		})
		.from(transactionCategories)
		.where(
			and(
				eq(transactionCategories.id, id),
				eq(transactionCategories.teamId, teamId)
			)
		)
		.limit(1);

	if (!result) {
		return undefined;
	}

	// Get children for this category
	const children = await db
		.select({
			id: transactionCategories.id,
			name: transactionCategories.name,
			color: transactionCategories.color,
			slug: transactionCategories.slug,
			description: transactionCategories.description,
			system: transactionCategories.system,
			taxRate: transactionCategories.taxRate,
			taxType: transactionCategories.taxType,
			taxReportingCode: transactionCategories.taxReportingCode,
			excluded: transactionCategories.excluded,
			parentId: transactionCategories.parentId,
		})
		.from(transactionCategories)
		.where(
			and(
				eq(transactionCategories.parentId, id),
				eq(transactionCategories.teamId, teamId)
			)
		)
		.orderBy(asc(transactionCategories.name));

	return {
		...result,
		children,
	};
};

export const getTransactionCategoryByIdOnly = (
	db: Database,
	{
		id,
		teamId,
	}: {
		id: string;
		teamId: string;
	}
) => {
	return db.query.transactionCategories.findFirst({
		where: (table, { and, eq }) =>
			and(eq(table.id, id), eq(table.teamId, teamId)),
	});
};

export const getBankAccountById = (
	db: Database,
	{
		id,
		teamId,
	}: {
		id: string;
		teamId: string;
	}
) => {
	return db.query.bankAccounts.findFirst({
		where: (table, { and, eq }) =>
			and(eq(table.id, id), eq(table.teamId, teamId)),
	});
};

// ─── Query: Transactions ──────────────────────────────────────────────────────

export const getTransactions = (
	db: Database,
	{ teamId }: { teamId: string }
) => {
	return db.query.transactions.findMany({
		orderBy: (table, { desc }) => [
			desc(table.transactionDate),
			desc(table.createdAt),
		],
		where: (table, { eq }) => eq(table.teamId, teamId),
		with: {
			category: true,
			bankAccount: true,
		},
	});
};

export const listTransactions = async (
	db: Database,
	{
		accounts,
		amountRange,
		assignees,
		attachments,
		categories,
		cursor,
		end,
		exported,
		fulfilled,
		internal,
		type,
		manual,
		pageSize = DEFAULT_TRANSACTIONS_LIMIT,
		q,
		recurring,
		sort,
		start,
		statuses,
		teamId,
	}: ListTransactionsInput
) => {
	const normalizedLimit = Math.min(
		Math.max(pageSize, 1),
		MAX_TRANSACTIONS_LIMIT
	);
	const decodedCursor = cursor ? decodeTransactionsCursor(cursor) : null;

	// Build sort order - default to date desc
	const orderByClause = sort
		? (table: TransactionQueryColumns) => {
				const [column, direction] = sort;
				const orderFn = direction === "asc" ? asc : desc;
				// Map column names to table columns
				switch (column) {
					case "amount":
						return orderFn(table.amount);
					case "date":
						return orderFn(table.transactionDate);
					case "name":
						return orderFn(table.description);
					default:
						return orderFn(table.transactionDate);
				}
			}
		: (table: TransactionQueryColumns) => [
				desc(table.transactionDate),
				desc(table.id),
			];

	const items = await db.query.transactions.findMany({
		limit: normalizedLimit + 1,
		orderBy: orderByClause,
		where: (table) =>
			buildListTransactionsWhere({
				accounts,
				amountRange,
				assignees,
				attachments,
				categories,
				decodedCursor,
				end,
				exported,
				fulfilled,
				internal,
				type,
				manual,
				q,
				recurring,
				start,
				statuses,
				teamId,
				table,
			}),
		with: {
			bankAccount: true,
			category: true,
			tags: {
				with: {
					tag: true,
				},
			},
		},
	});

	const hasMore = items.length > normalizedLimit;
	const visibleItems = hasMore ? items.slice(0, normalizedLimit) : items;
	const lastItem = visibleItems.at(-1);

	return {
		items: visibleItems,
		nextCursor:
			hasMore && lastItem
				? encodeTransactionsCursor({
						id: lastItem.id,
						transactionDate: lastItem.transactionDate.toISOString(),
					})
				: null,
	};
};

export const getTransactionById = (
	db: Database,
	{
		id,
		teamId,
	}: {
		id: string;
		teamId: string;
	}
) => {
	return db.query.transactions.findFirst({
		where: (table, { and, eq }) =>
			and(eq(table.id, id), eq(table.teamId, teamId)),
		with: {
			category: true,
			bankAccount: true,
			tags: {
				with: {
					tag: true,
				},
			},
		},
	});
};

// ─── Query: Review Count ─────────────────────────────────────────────────────
// Count transactions ready for review (fulfilled but not exported)

export const getReviewCount = async (db: Database, teamId: string) => {
	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(transactions)
		.where(
			and(
				eq(transactions.teamId, teamId),
				// Active workflow
				sql`"transactions"."status" NOT IN ('excluded', 'archived')`,
				// Is fulfilled (has attachments OR status=completed)
				sql`(
					EXISTS (
						SELECT 1
						FROM ${transactionAttachments}
						WHERE "transaction_attachments"."transaction_id" = "transactions"."id"
						AND "transaction_attachments"."team_id" = ${teamId}
					) OR "transactions"."status" = 'completed'
				)`,
				// NOT exported
				sql`NOT (
					"transactions"."status" = 'exported' OR EXISTS (
						SELECT 1
						FROM ${accountingSyncRecords}
						WHERE "accounting_sync_records"."transaction_id" = "transactions"."id"
						AND "accounting_sync_records"."team_id" = ${teamId}
						AND "accounting_sync_records"."status" = 'synced'
					)
				)`
			)
		);

	return { count: result[0]?.count ?? 0 };
};

// ─── Mutation: Create ─────────────────────────────────────────────────────────

export const createTransaction = async (
	db: Database,
	input: CreateTransactionInput
) => {
	const [transaction] = await db.insert(transactions).values(input).returning();
	return transaction;
};

// ─── Mutation: Update ─────────────────────────────────────────────────────────

export const updateTransaction = async (
	db: Database,
	input: UpdateTransactionInput
) => {
	const updateData: Partial<typeof transactions.$inferInsert> = {
		updatedAt: new Date(),
	};

	// Only include fields that are explicitly provided (partial update pattern)
	if (input.amount !== undefined) {
		updateData.amount = input.amount;
	}
	if (input.assignedId !== undefined) {
		updateData.assignedId = input.assignedId;
	}
	if (input.bankAccountId !== undefined) {
		updateData.bankAccountId = input.bankAccountId;
	}
	if (input.baseAmount !== undefined) {
		updateData.baseAmount = input.baseAmount;
	}
	if (input.baseCurrency !== undefined) {
		updateData.baseCurrency = input.baseCurrency;
	}
	if (input.categorySlug !== undefined) {
		updateData.categorySlug = input.categorySlug;
	}
	if (input.counterpartyName !== undefined) {
		updateData.counterpartyName = input.counterpartyName;
	}
	if (input.currency !== undefined) {
		updateData.currency = input.currency;
	}
	if (input.description !== undefined) {
		updateData.description = input.description;
	}
	if (input.enrichmentCompleted !== undefined) {
		updateData.enrichmentCompleted = input.enrichmentCompleted;
	}
	if (input.frequency !== undefined) {
		updateData.frequency = input.frequency;
	}
	if (input.internal !== undefined) {
		updateData.internal = input.internal;
	}
	if (input.merchantName !== undefined) {
		updateData.merchantName = input.merchantName;
	}
	if (input.method !== undefined) {
		updateData.method = input.method;
	}
	if (input.name !== undefined) {
		updateData.name = input.name;
	}
	if (input.note !== undefined) {
		updateData.note = input.note;
	}
	if (input.recurring !== undefined) {
		updateData.recurring = input.recurring;
	}
	if (input.status !== undefined) {
		updateData.status = input.status;
	}
	if (input.taxAmount !== undefined) {
		updateData.taxAmount = input.taxAmount;
	}
	if (input.taxRate !== undefined) {
		updateData.taxRate = input.taxRate;
	}
	if (input.taxType !== undefined) {
		updateData.taxType = input.taxType;
	}
	if (input.transactionDate !== undefined) {
		updateData.transactionDate = input.transactionDate;
	}

	const [transaction] = await db
		.update(transactions)
		.set(updateData)
		.where(
			and(eq(transactions.id, input.id), eq(transactions.teamId, input.teamId))
		)
		.returning();

	return transaction;
};

export const setTransactionReviewState = async (
	db: Database,
	input: SetTransactionReviewStateInput
) => {
	const [transaction] = await db
		.update(transactions)
		.set({
			status: input.status,
			updatedAt: new Date(),
		})
		.where(
			and(eq(transactions.id, input.id), eq(transactions.teamId, input.teamId))
		)
		.returning();

	return transaction;
};

// ─── Mutation: Delete ─────────────────────────────────────────────────────────

export const deleteTransaction = async (
	db: Database,
	input: {
		id: string;
		teamId: string;
	}
) => {
	const [transaction] = await db
		.delete(transactions)
		.where(
			and(eq(transactions.id, input.id), eq(transactions.teamId, input.teamId))
		)
		.returning();

	return transaction;
};

export const deleteTransactions = async (
	db: Database,
	input: {
		ids: string[];
		teamId: string;
	}
) => {
	const deletedTransactions = await db
		.delete(transactions)
		.where(
			and(
				inArray(transactions.id, input.ids),
				eq(transactions.teamId, input.teamId)
			)
		)
		.returning();

	return deletedTransactions;
};

// ─── Mutation: Bulk Update ─────────────────────────────────────────────────

export interface BulkUpdateTransactionsInput {
	assignedId?: string | null;
	categorySlug?: string | null;
	ids: string[];
	status?: "excluded" | "posted";
	teamId: string;
}

export const bulkUpdateTransactions = async (
	db: Database,
	input: BulkUpdateTransactionsInput
) => {
	const { ids, teamId, categorySlug, status, assignedId } = input;
	const updates: Record<string, unknown> = {
		updatedAt: new Date(),
	};

	if (categorySlug !== undefined) {
		updates.categorySlug = categorySlug;
	}

	if (status !== undefined) {
		updates.status = status;
	}

	if (assignedId !== undefined) {
		updates.assignedId = assignedId;
	}

	const updatedTransactions = await db
		.update(transactions)
		.set(updates)
		.where(and(inArray(transactions.id, ids), eq(transactions.teamId, teamId)))
		.returning();

	return updatedTransactions;
};

// ─── Category CRUD ────────────────────────────────────────────────────────────

// Note: 'kind' field removed from categories - income/expense determined by transaction amount sign
// Note: parentId (UUID) replaces parentSlug for FK integrity

export interface CreateTransactionCategoryInput {
	color?: string;
	description?: string;
	excluded?: boolean;
	name: string;
	parentId?: string;
	slug: string;
	taxRate?: number;
	taxType?: string;
	teamId: string;
}

export const createTransactionCategory = async (
	db: Database,
	input: CreateTransactionCategoryInput
) => {
	const [category] = await db
		.insert(transactionCategories)
		.values({
			color: input.color ?? null,
			excluded: input.excluded ?? false,
			name: input.name,
			parentId: input.parentId ?? null,
			slug: input.slug,
			description: input.description ?? null,
			taxRate: input.taxRate ?? null,
			taxType: input.taxType ?? null,
			system: false,
			teamId: input.teamId,
		})
		.returning();

	return category;
};

export interface UpdateTransactionCategoryInput {
	color?: string | null;
	description?: string | null;
	excluded?: boolean | null;
	id: string;
	name?: string;
	parentId?: string | null;
	taxRate?: number | null;
	taxReportingCode?: string | null;
	taxType?: string | null;
	teamId: string;
}

export const updateTransactionCategory = async (
	db: Database,
	input: UpdateTransactionCategoryInput
) => {
	const [category] = await db
		.update(transactionCategories)
		.set({
			color: input.color,
			excluded: input.excluded,
			name: input.name,
			parentId: input.parentId,
			taxRate: input.taxRate,
			taxType: input.taxType,
			description: input.description,
		})
		.where(
			and(
				eq(transactionCategories.id, input.id),
				eq(transactionCategories.teamId, input.teamId)
			)
		)
		.returning();

	return category;
};

export const deleteTransactionCategory = async (
	db: Database,
	input: {
		id: string;
		teamId: string;
	}
) => {
	const [category] = await db
		.delete(transactionCategories)
		.where(
			and(
				eq(transactionCategories.id, input.id),
				eq(transactionCategories.teamId, input.teamId),
				eq(transactionCategories.system, false) // Cannot delete system categories
			)
		)
		.returning();

	return category;
};

// ─── Seeding: Ensure Default Categories ──────────────────────────────────────

// Note: 'kind' removed from categories schema - income/expense determined by transaction amount

interface SeedableCategory {
	color?: string;
	description?: string;
	excluded?: boolean;
	name: string;
	parentId?: string;
	parentSlug?: string;
	slug: string;
	system?: boolean;
	taxRate?: number;
	taxType?: string;
}

export const ensureDefaultTransactionCategories = async (
	db: Database,
	{
		categories,
		teamId,
	}: {
		categories: SeedableCategory[];
		teamId: string;
	}
) => {
	const existingCategories = await db.query.transactionCategories.findMany({
		where: (table, { and, eq }) =>
			and(eq(table.teamId, teamId), eq(table.system, true)),
	});

	if (existingCategories.length > 0) {
		return existingCategories;
	}

	// Separate parents and children
	const parents = categories.filter((c) => !c.parentSlug);
	const children = categories.filter((c) => c.parentSlug);

	// Insert parents first (without parentId)
	const insertedParents = await db
		.insert(transactionCategories)
		.values(
			parents.map((category) => ({
				color: category.color ?? null,
				excluded: category.excluded ?? false,
				name: category.name,
				slug: category.slug,
				system: category.system ?? true,
				taxRate: category.taxRate ?? null,
				taxType: category.taxType ?? null,
				description: category.description ?? null,
				teamId,
			}))
		)
		.returning();

	// Create slug -> id mapping
	const slugToId = new Map<string, string>();
	for (const parent of insertedParents) {
		if (parent.slug) {
			slugToId.set(parent.slug, parent.id);
		}
	}

	// Insert children with parentId
	if (children.length > 0) {
		await db
			.insert(transactionCategories)
			.values(
				children.map((category) => {
					const parentFromSlug = category.parentSlug
						? slugToId.get(category.parentSlug)
						: undefined;
					return {
						color: category.color ?? null,
						excluded: category.excluded ?? false,
						name: category.name,
						parentId: parentFromSlug,
						slug: category.slug,
						system: category.system ?? true,
						taxRate: category.taxRate ?? null,
						taxType: category.taxType ?? null,
						description: category.description ?? null,
						teamId,
					};
				})
			)
			.returning();
	}

	// Return all inserted categories
	return db.query.transactionCategories.findMany({
		where: (table, { and, eq }) =>
			and(eq(table.teamId, teamId), eq(table.system, true)),
	});
};
