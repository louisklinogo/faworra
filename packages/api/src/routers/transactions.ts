import { CATEGORIES } from "@faworra-new/categories";
import {
	createTransaction,
	ensureDefaultTransactionCategories,
	getTransactionById,
	getTransactionCategories,
	getTransactionCategoryById,
	getTransactions,
	updateTransaction,
} from "@faworra-new/db/queries/transactions";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedTeamProcedure, router } from "../index";

const transactionInputSchema = z.object({
	amount: z.number().int(),
	categoryId: z.string().uuid().nullable().optional(),
	currency: z.string().trim().length(3),
	description: z.string().trim().min(2).max(200),
	kind: z.enum(["income", "expense"]),
	transactionDate: z.coerce.date(),
});

export const transactionsRouter = router({
	categories: protectedTeamProcedure.query(async ({ ctx }) => {
		await ensureDefaultTransactionCategories({
			categories: [...CATEGORIES],
			teamId: ctx.activeTeam.id,
		});

		return getTransactionCategories({ teamId: ctx.activeTeam.id });
	}),
	bootstrapCategories: protectedTeamProcedure.mutation(({ ctx }) => {
		return ensureDefaultTransactionCategories({
			categories: [...CATEGORIES],
			teamId: ctx.activeTeam.id,
		});
	}),
	create: protectedTeamProcedure
		.input(transactionInputSchema)
		.mutation(async ({ ctx, input }) => {
			await ensureDefaultTransactionCategories({
				categories: [...CATEGORIES],
				teamId: ctx.activeTeam.id,
			});

			if (input.categoryId) {
				const category = await getTransactionCategoryById({
					id: input.categoryId,
					kind: input.kind,
					teamId: ctx.activeTeam.id,
				});

				if (!category) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Category does not belong to this workspace or kind",
					});
				}
			}

			return createTransaction({
				...input,
				teamId: ctx.activeTeam.id,
			});
		}),
	get: protectedTeamProcedure.query(async ({ ctx }) => {
		await ensureDefaultTransactionCategories({
			categories: [...CATEGORIES],
			teamId: ctx.activeTeam.id,
		});

		return getTransactions({ teamId: ctx.activeTeam.id });
	}),
	getById: protectedTeamProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const transaction = await getTransactionById({
				id: input.id,
				teamId: ctx.activeTeam.id,
			});

			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			return transaction;
		}),
	update: protectedTeamProcedure
		.input(transactionInputSchema.extend({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ensureDefaultTransactionCategories({
				categories: [...CATEGORIES],
				teamId: ctx.activeTeam.id,
			});

			if (input.categoryId) {
				const category = await getTransactionCategoryById({
					id: input.categoryId,
					kind: input.kind,
					teamId: ctx.activeTeam.id,
				});

				if (!category) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Category does not belong to this workspace or kind",
					});
				}
			}

			const transaction = await updateTransaction({
				...input,
				teamId: ctx.activeTeam.id,
			});

			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			return transaction;
		}),
});
