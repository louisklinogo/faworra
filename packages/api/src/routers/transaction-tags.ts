import { getTagById } from "@faworra-new/db/queries/tags";
import {
	createTransactionTag,
	deleteTransactionTag,
} from "@faworra-new/db/queries/transaction-tags";
import { getTransactionById } from "@faworra-new/db/queries/transactions";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedTeamProcedure, router } from "../index";

export const transactionTagsRouter = router({
	create: protectedTeamProcedure
		.input(
			z.object({
				transactionId: z.string().uuid(),
				tagId: z.string().uuid(),
			})
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

			// Verify tag belongs to team
			const tag = await getTagById(ctx.db, {
				id: input.tagId,
				teamId: ctx.activeTeam.id,
			});

			if (!tag) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tag not found",
				});
			}

			return createTransactionTag(ctx.db, {
				teamId: ctx.activeTeam.id,
				transactionId: input.transactionId,
				tagId: input.tagId,
			});
		}),

	delete: protectedTeamProcedure
		.input(
			z.object({
				transactionId: z.string().uuid(),
				tagId: z.string().uuid(),
			})
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

			return deleteTransactionTag(ctx.db, {
				transactionId: input.transactionId,
				tagId: input.tagId,
				teamId: ctx.activeTeam.id,
			});
		}),
});
