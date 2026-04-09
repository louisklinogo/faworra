import { FLAT_CATEGORIES } from "@faworra-new/categories";
import {
	createTransaction,
	ensureDefaultTransactionCategories,
	getBankAccountById,
	getReviewCount,
	getTransactionById,
	getTransactionCategories,
	getTransactions,
	isTransactionsCursor,
	listTransactions,
	setTransactionReviewState,
	updateTransaction,
} from "@faworra-new/db/queries/transactions";
import {
	createTransactionAttachment,
	deleteTransactionAttachment,
	getTransactionAttachments,
} from "@faworra-new/db/queries/transaction-attachments";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	protectedFinanceTeamProcedure,
	protectedTeamProcedure,
	router,
} from "../index";
import { isValidTransactionReviewTransition } from "../lib/transactions";

const baseTransactionInputSchema = z.object({
	amount: z.number().int(),
	bankAccountId: z.string().uuid().nullable().optional(),
	counterpartyName: z.string().trim().max(100).nullable().optional(),
	currency: z.string().trim().length(3),
	description: z.string().trim().max(500).nullable().optional(),
	internal: z.boolean(),
	// Note: 'kind' field removed - income/expense determined by amount sign
	// amount > 0 = income, amount < 0 = expense (Midday pattern)
	method: z.enum(["payment", "card_purchase", "card_atm", "transfer", "other", "unknown", "ach", "interest", "deposit", "wire", "fee", "momo", "cash"]).optional(),
	name: z.string().trim().min(1).max(200),
	note: z.string().nullable().optional(),
	taxAmount: z.number().int().nullable().optional(),
	taxRate: z.number().nullable().optional(),
	taxType: z.string().trim().max(20).nullable().optional(),
	transactionDate: z.coerce.date(),
});

const createTransactionInputSchema = baseTransactionInputSchema.extend({
	internal: z.boolean().default(false),
	internalId: z.string().trim().min(1), // Required for idempotency
});

const updateTransactionInputSchema = baseTransactionInputSchema.extend({
	id: z.string().uuid(),
	internal: z.boolean().optional(),
	name: z.string().trim().min(1).max(200).optional(),
});

const listTransactionsInputSchema = z.object({
	accounts: z.array(z.string().uuid()).nullish(),
	amountRange: z.array(z.coerce.number()).max(2).nullish(),
	assignees: z.array(z.string().uuid()).nullish(),
	attachments: z.enum(["include", "exclude"]).nullish(),
	categories: z.array(z.string().trim().min(1)).nullish(),
	cursor: z.string().nullish(),
	end: z.string().nullish(),
	/** Filter by export status: true = only exported, false = only NOT exported */
	exported: z.boolean().nullish(),
	/** Filter by fulfillment: true = ready for review (has attachments OR status=completed), false = not ready */
	fulfilled: z.boolean().nullish(),
	internal: z.boolean().nullish(),
	/** Filter by type using amount sign: "expense" = amount < 0, "income" = amount > 0 */
	type: z.enum(["income", "expense"]).nullish(),
	manual: z.enum(["include", "exclude"]).nullish(),
	pageSize: z.coerce.number().int().min(1).max(10000).nullish(),
	q: z.string().trim().nullish(),
	recurring: z.array(z.string()).nullish(),
	sort: z.array(z.string().min(1)).max(2).min(2).nullish(),
	start: z.string().nullish(),
	statuses: z
		.array(
			z.enum([
				"blank",
				"receipt_match",
				"in_review",
				"export_error",
				"exported",
				"excluded",
				"archived",
			]),
		)
		.nullish(),
});

const setReviewStateInputSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(["excluded", "posted"]),
});

// Validate transaction amount (Midday pattern - no explicit kind field)
const assertValidAmount = (amount: number) => {
	if (amount === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Transaction amount cannot be zero",
		});
	}
};

const assertValidListTransactionsInput = (
	input: z.infer<typeof listTransactionsInputSchema> | undefined,
) => {
	if (!input) {
		return;
	}

	if (input.cursor && !isTransactionsCursor(input.cursor)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid transactions cursor",
		});
	}

	if (input.start && input.end) {
		const startDate = new Date(input.start);
		const endDate = new Date(input.end);
		if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
			if (startDate > endDate) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "start must be earlier than or equal to end",
				});
			}
		}
	}

	if (input.amountRange && input.amountRange.length === 2) {
		const [min, max] = input.amountRange;
		if (min !== null && min !== undefined && max !== null && max !== undefined && min > max) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "amountRange[0] must be less than or equal to amountRange[1]",
			});
		}
	}
};

export const transactionsRouter = router({
	categories: protectedTeamProcedure.query(async ({ ctx }) => {
		await ensureDefaultTransactionCategories(ctx.db, {
			categories: [...FLAT_CATEGORIES],
			teamId: ctx.activeTeam.id,
		});

		return getTransactionCategories(ctx.db, { teamId: ctx.activeTeam.id });
	}),
	bootstrapCategories: protectedTeamProcedure.mutation(({ ctx }) => {
		return ensureDefaultTransactionCategories(ctx.db, {
			categories: [...FLAT_CATEGORIES],
			teamId: ctx.activeTeam.id,
		});
	}),
	create: protectedFinanceTeamProcedure
		.input(createTransactionInputSchema)
		.mutation(async ({ ctx, input }) => {
			await ensureDefaultTransactionCategories(ctx.db, {
				categories: [...FLAT_CATEGORIES],
				teamId: ctx.activeTeam.id,
			});

			assertValidAmount(input.amount);

			if (input.bankAccountId) {
				const bankAccount = await getBankAccountById(ctx.db, {
					id: input.bankAccountId,
					teamId: ctx.activeTeam.id,
				});

				if (!bankAccount) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Bank account does not belong to this workspace",
					});
				}
			}

			return createTransaction(ctx.db, {
				...input,
				teamId: ctx.activeTeam.id,
			});
		}),
	get: protectedTeamProcedure.query(async ({ ctx }) => {
		await ensureDefaultTransactionCategories(ctx.db, {
			categories: [...FLAT_CATEGORIES],
			teamId: ctx.activeTeam.id,
		});

		return getTransactions(ctx.db, { teamId: ctx.activeTeam.id });
	}),
	list: protectedTeamProcedure
		.input(listTransactionsInputSchema.optional())
		.query(async ({ ctx, input }) => {
			await ensureDefaultTransactionCategories(ctx.db, {
				categories: [...FLAT_CATEGORIES],
				teamId: ctx.activeTeam.id,
			});

			assertValidListTransactionsInput(input);

			const result = await listTransactions(ctx.db, {
				accounts: input?.accounts ?? null,
				amountRange: input?.amountRange as [number, number] | null | undefined,
				assignees: input?.assignees ?? null,
				attachments: input?.attachments ?? null,
				categories: input?.categories ?? null,
				cursor: input?.cursor ?? null,
				end: input?.end ?? null,
				exported: input?.exported ?? null,
				fulfilled: input?.fulfilled ?? null,
				internal: input?.internal ?? null,
				type: input?.type ?? null,
				manual: input?.manual ?? null,
				pageSize: input?.pageSize ?? undefined,
				q: input?.q ?? null,
				recurring: input?.recurring ?? null,
				sort: input?.sort as [string, "asc" | "desc"] | null | undefined,
				start: input?.start ?? null,
				statuses: input?.statuses ?? null,
				teamId: ctx.activeTeam.id,
			});

			// Transform tags from { tag: { id, name } } to { id, name }
			return {
				...result,
				items: result.items.map((item) => ({
					...item,
					tags: item.tags?.map((t) => ({
						id: t.tag.id,
						name: t.tag.name,
					})),
				})),
			};
		}),
	getById: protectedTeamProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const transaction = await getTransactionById(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});

			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			// Transform tags from { tag: { id, name } } to { id, name }
			return {
				...transaction,
				tags: transaction.tags?.map((t) => ({
					id: t.tag.id,
					name: t.tag.name,
				})),
			};
		}),
	update: protectedFinanceTeamProcedure
		.input(updateTransactionInputSchema)
		.mutation(async ({ ctx, input }) => {
			await ensureDefaultTransactionCategories(ctx.db, {
				categories: [...FLAT_CATEGORIES],
				teamId: ctx.activeTeam.id,
			});

			assertValidAmount(input.amount);

			if (input.bankAccountId) {
				const bankAccount = await getBankAccountById(ctx.db, {
					id: input.bankAccountId,
					teamId: ctx.activeTeam.id,
				});

				if (!bankAccount) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Bank account does not belong to this workspace",
					});
				}
			}

			const transaction = await updateTransaction(ctx.db, {
				amount: input.amount,
				bankAccountId: input.bankAccountId,
				counterpartyName: input.counterpartyName,
				currency: input.currency,
				description: input.description,
				id: input.id,
				internal: input.internal,
				method: input.method,
				name: input.name,
				note: input.note,
				taxAmount: input.taxAmount,
				taxRate: input.taxRate,
				taxType: input.taxType,
				teamId: ctx.activeTeam.id,
				transactionDate: input.transactionDate,
			});

			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			return transaction;
		}),
	setReviewState: protectedFinanceTeamProcedure
		.input(setReviewStateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const transaction = await getTransactionById(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});

			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			if (
				!isValidTransactionReviewTransition({
					from: transaction.status,
					to: input.status,
				})
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Invalid review transition from ${transaction.status} to ${input.status}`,
				});
			}

			const updatedTransaction = await setTransactionReviewState(ctx.db, {
				id: input.id,
				status: input.status,
				teamId: ctx.activeTeam.id,
			});

			if (!updatedTransaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			return updatedTransaction;
		}),
	delete: protectedFinanceTeamProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const transaction = await getTransactionById(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});

			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			// Import delete function dynamically to avoid circular dependency
			const { deleteTransaction } = await import(
				"@faworra-new/db/queries/transactions"
			);
			const deleted = await deleteTransaction(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});

			if (!deleted) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Failed to delete transaction",
				});
			}

			return deleted;
		}),
	deleteMany: protectedFinanceTeamProcedure
		.input(z.object({ ids: z.array(z.string().uuid()) }))
		.mutation(async ({ ctx, input }) => {
			const { deleteTransactions } = await import(
				"@faworra-new/db/queries/transactions"
			);

			const deleted = await deleteTransactions(ctx.db, {
				ids: input.ids,
				teamId: ctx.activeTeam.id,
			});

			return deleted;
		}),
	updateMany: protectedFinanceTeamProcedure
		.input(
			z.object({
				ids: z.array(z.string().uuid()),
				categoryId: z.string().uuid().nullable().optional(),
				status: z.enum(["excluded", "posted"]).optional(),
				assignedId: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { bulkUpdateTransactions, getTransactionCategoryByIdOnly } =
				await import("@faworra-new/db/queries/transactions");

			let categorySlug: string | null | undefined = undefined;

			// If categoryId is provided, validate it
			if (input.categoryId !== undefined) {
				if (input.categoryId === null) {
					categorySlug = null;
				} else {
					// Get the category to determine the kind (income/expense)
					// For bulk updates, we'll skip kind validation and just use the category
					const category = await getTransactionCategoryByIdOnly(ctx.db, {
						id: input.categoryId,
						teamId: ctx.activeTeam.id,
					});

					if (!category) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Category not found",
						});
					}

					categorySlug = category.slug;
				}
			}

			const updated = await bulkUpdateTransactions(ctx.db, {
				assignedId: input.assignedId,
				categorySlug,
				ids: input.ids,
				status: input.status,
				teamId: ctx.activeTeam.id,
			});

			return updated;
		}),
	getAttachments: protectedTeamProcedure
		.input(z.object({ transactionId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// Verify transaction belongs to team
			const transaction = await getTransactionById(ctx.db, {
				id: input.transactionId,
				teamId: ctx.activeTeam.id,
			});

			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			return getTransactionAttachments(ctx.db, {
				teamId: ctx.activeTeam.id,
				transactionId: input.transactionId,
			});
		}),
	addAttachment: protectedFinanceTeamProcedure
		.input(
			z.object({
				filename: z.string(),
				mimeType: z.string(),
				path: z.string(),
				size: z.number().int(),
				transactionId: z.string().uuid(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify transaction belongs to team
			const transaction = await getTransactionById(ctx.db, {
				id: input.transactionId,
				teamId: ctx.activeTeam.id,
			});

			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			return createTransactionAttachment(ctx.db, {
				...input,
				teamId: ctx.activeTeam.id,
			});
		}),
	removeAttachment: protectedFinanceTeamProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const deleted = await deleteTransactionAttachment(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});

			if (!deleted) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attachment not found",
				});
			}

			return deleted;
		}),
	createCategory: protectedFinanceTeamProcedure
		.input(
			z.object({
				color: z.string().trim().min(1).optional(),
				excluded: z.boolean().optional(),
				name: z.string().trim().min(1).max(100),
				parentId: z.string().uuid().optional(),
				slug: z.string().trim().min(1).max(100),
				taxRate: z.number().optional(),
				taxType: z.string().optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { createTransactionCategory } = await import(
				"@faworra-new/db/queries/transactions"
			);

			// Check for duplicate slug
			const existing = await getTransactionCategories(ctx.db, {
				teamId: ctx.activeTeam.id,
			});
			const duplicate = existing.find((c) => c.slug === input.slug);
			if (duplicate) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Category with this slug already exists",
				});
			}

			return createTransactionCategory(ctx.db, {
				...input,
				teamId: ctx.activeTeam.id,
			});
		}),
	updateCategory: protectedFinanceTeamProcedure
		.input(
			z.object({
				color: z.string().trim().min(1).optional(),
				excluded: z.boolean().optional(),
				id: z.string().uuid(),
				name: z.string().trim().min(1).max(100).optional(),
				parentId: z.string().uuid().nullable().optional(),
				taxRate: z.number().optional(),
				taxType: z.string().optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { getTransactionCategoryByIdOnly, updateTransactionCategory } =
				await import("@faworra-new/db/queries/transactions");

			// Verify category exists and belongs to team
			const category = await getTransactionCategoryByIdOnly(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});

			if (!category) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			if (category.system) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot modify system categories",
				});
			}

			return updateTransactionCategory(ctx.db, {
				...input,
				teamId: ctx.activeTeam.id,
			});
		}),
	deleteCategory: protectedFinanceTeamProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { deleteTransactionCategory, getTransactionCategoryByIdOnly } =
				await import("@faworra-new/db/queries/transactions");
			// Verify category exists and belongs to team
			const category = await getTransactionCategoryByIdOnly(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});

			if (!category) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			if (category.system) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot delete system categories",
				});
			}

			return deleteTransactionCategory(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});
		}),
	reviewCount: protectedTeamProcedure.query(async ({ ctx }) => {
		return getReviewCount(ctx.db, ctx.activeTeam.id);
	}),
});
