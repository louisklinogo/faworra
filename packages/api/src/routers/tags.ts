import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedTeamProcedure, router } from "../index";
import {
	createTag,
	deleteTag,
	getTagById,
	getTags,
	updateTag,
} from "@faworra-new/db/queries/tags";

export const tagsRouter = router({
	get: protectedTeamProcedure.query(async ({ ctx }) => {
		return getTags(ctx.db, {
			teamId: ctx.activeTeam.id,
		});
	}),

	create: protectedTeamProcedure
		.input(z.object({ name: z.string().min(1).max(50) }))
		.mutation(async ({ ctx, input }) => {
			return createTag(ctx.db, {
				teamId: ctx.activeTeam.id,
				name: input.name,
			});
		}),

	delete: protectedTeamProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await getTagById(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tag not found",
				});
			}

			return deleteTag(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});
		}),

	update: protectedTeamProcedure
		.input(z.object({ id: z.string().uuid(), name: z.string().min(1).max(50) }))
		.mutation(async ({ ctx, input }) => {
			const existing = await getTagById(ctx.db, {
				id: input.id,
				teamId: ctx.activeTeam.id,
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tag not found",
				});
			}

			return updateTag(ctx.db, {
				id: input.id,
				name: input.name,
				teamId: ctx.activeTeam.id,
			});
		}),
});
