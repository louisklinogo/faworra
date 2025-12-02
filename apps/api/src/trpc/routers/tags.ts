import { createTag, deleteTag, getTagById, getTags, getTagsWithUsage, updateTag } from "@Faworra/database/queries";
import { communicationThreadTags, and, eq, tags as tagsTable } from "@Faworra/database/schema";
import { activities } from "@Faworra/database/schema";
import { z } from "zod";
import { createTRPCRouter, teamProcedure } from "../init";

const NAME_MAX = 100;

const createSchema = z.object({
  name: z.string().min(1).max(NAME_MAX),
  color: z.string().nullable().optional(),
});

const updateSchema = createSchema.partial().extend({
  id: z.string().uuid(),
});

export const tagsRouter = createTRPCRouter({
  list: teamProcedure.query(async ({ ctx }) => await getTags(ctx.db, { teamId: ctx.teamId })),

  listWithUsage: teamProcedure.query(async ({ ctx }) => await getTagsWithUsage(ctx.db, { teamId: ctx.teamId })),

  byId: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => await getTagById(ctx.db, ctx.teamId, input.id)),

  create: teamProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
    const row = await createTag(ctx.db, {
      teamId: ctx.teamId,
      name: input.name,
      color: input.color || undefined,
    });

    // Activity log
    await ctx.db.insert(activities).values({
      teamId: ctx.teamId,
      userId: ctx.userId,
      type: "tag.create",
      metadata: {
        id: row.id,
        name: row.name,
        color: row.color,
      } as any,
    });

    return row;
  }),

  update: teamProcedure.input(updateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    const row = await updateTag(ctx.db, ctx.teamId, { id, ...data });

    // Activity log
    await ctx.db.insert(activities).values({
      teamId: ctx.teamId,
      userId: ctx.userId,
      type: "tag.update",
      metadata: {
        id: row?.id,
        name: row?.name,
        color: row?.color,
      } as any,
    });

    return row;
  }),

  delete: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const row = await deleteTag(ctx.db, ctx.teamId, input.id);

      // Activity log
      await ctx.db.insert(activities).values({
        teamId: ctx.teamId,
        userId: ctx.userId,
        type: "tag.delete",
        metadata: {
          id: row?.id,
          name: row?.name,
        } as any,
      });

      return row;
    }),

  merge: teamProcedure
    .input(z.object({ sourceId: z.string().uuid(), targetId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.sourceId === input.targetId) return { success: true };
      // Get all threadIds that have source tag
      const sourceRows = await ctx.db
        .select({ threadId: communicationThreadTags.threadId })
        .from(communicationThreadTags)
        .where(and(eq(communicationThreadTags.teamId, ctx.teamId), eq(communicationThreadTags.tagId, input.sourceId)));
      if (sourceRows.length === 0) {
        // Just delete source tag
        await ctx.db.delete(tagsTable).where(and(eq(tagsTable.id, input.sourceId), eq(tagsTable.teamId, ctx.teamId)));
        return { success: true };
      }
      const threadIds = sourceRows.map((r) => r.threadId);
      // Find threadIds that already have target
      const existingTarget = await ctx.db
        .select({ threadId: communicationThreadTags.threadId })
        .from(communicationThreadTags)
        .where(and(eq(communicationThreadTags.teamId, ctx.teamId), eq(communicationThreadTags.tagId, input.targetId)));
      const hasTarget = new Set(existingTarget.map((r) => r.threadId));
      // Insert target for threads that don't already have it
      const toInsert = threadIds.filter((tid) => !hasTarget.has(tid));
      if (toInsert.length) {
        await ctx.db.insert(communicationThreadTags).values(toInsert.map((tid) => ({ teamId: ctx.teamId, threadId: tid, tagId: input.targetId })));
      }
      // Delete all source tag links
      await ctx.db
        .delete(communicationThreadTags)
        .where(and(eq(communicationThreadTags.teamId, ctx.teamId), eq(communicationThreadTags.tagId, input.sourceId)));
      // Delete the source tag itself
      await ctx.db.delete(tagsTable).where(and(eq(tagsTable.id, input.sourceId), eq(tagsTable.teamId, ctx.teamId)));
      return { success: true };
    }),
});
