import { and, eq } from "drizzle-orm";

import { db } from "../index";
import { transactionCategories, transactions } from "../schema/financial";

export interface CreateTransactionInput {
	amount: number;
	categoryId?: string | null;
	currency: string;
	description: string;
	kind: "income" | "expense";
	teamId: string;
	transactionDate: Date;
}

export interface UpdateTransactionInput {
	amount?: number;
	categoryId?: string | null;
	currency?: string;
	description?: string;
	id: string;
	kind?: "income" | "expense";
	teamId: string;
	transactionDate?: Date;
}

export const getTransactionCategories = ({ teamId }: { teamId: string }) => {
	return db.query.transactionCategories.findMany({
		orderBy: (table, { asc }) => [asc(table.kind), asc(table.name)],
		where: (table, { eq }) => eq(table.teamId, teamId),
	});
};

export const getTransactionCategoryById = ({
	id,
	kind,
	teamId,
}: {
	id: string;
	kind: "income" | "expense";
	teamId: string;
}) => {
	return db.query.transactionCategories.findFirst({
		where: (table, { and, eq }) =>
			and(eq(table.id, id), eq(table.kind, kind), eq(table.teamId, teamId)),
	});
};

export const getTransactions = ({ teamId }: { teamId: string }) => {
	return db.query.transactions.findMany({
		orderBy: (table, { desc }) => [
			desc(table.transactionDate),
			desc(table.createdAt),
		],
		where: (table, { eq }) => eq(table.teamId, teamId),
		with: {
			category: true,
		},
	});
};

export const getTransactionById = ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	return db.query.transactions.findFirst({
		where: (table, { and, eq }) =>
			and(eq(table.id, id), eq(table.teamId, teamId)),
		with: {
			category: true,
		},
	});
};

export const createTransaction = async (input: CreateTransactionInput) => {
	const [transaction] = await db.insert(transactions).values(input).returning();
	return transaction;
};

export const updateTransaction = async (input: UpdateTransactionInput) => {
	const [transaction] = await db
		.update(transactions)
		.set({
			amount: input.amount,
			categoryId: input.categoryId,
			currency: input.currency,
			description: input.description,
			kind: input.kind,
			transactionDate: input.transactionDate,
			updatedAt: new Date(),
		})
		.where(
			and(eq(transactions.id, input.id), eq(transactions.teamId, input.teamId))
		)
		.returning();

	return transaction;
};

export const ensureDefaultTransactionCategories = async ({
	categories,
	teamId,
}: {
	categories: Array<{
		color: string;
		kind: "income" | "expense";
		name: string;
		slug: string;
	}>;
	teamId: string;
}) => {
	const existingCategories = await db.query.transactionCategories.findMany({
		where: (table, { eq }) => eq(table.teamId, teamId),
	});

	if (existingCategories.length > 0) {
		return existingCategories;
	}

	return db
		.insert(transactionCategories)
		.values(
			categories.map((category) => ({
				...category,
				teamId,
			}))
		)
		.returning();
};
