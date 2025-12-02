import { z } from "zod";
import { createTRPCRouter, teamProcedure } from "../init";
import { invoiceTemplates, eq } from "@Faworra/database/schema";

export const invoiceTemplatesRouter = createTRPCRouter({
  get: teamProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ template: invoiceTemplates.template })
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.teamId, ctx.teamId!));
    return rows[0]?.template ?? {};
  }),

  upsert: teamProcedure
    .input(z.object({ template: z.record(z.any()) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ teamId: invoiceTemplates.teamId, template: invoiceTemplates.template })
        .from(invoiceTemplates)
        .where(eq(invoiceTemplates.teamId, ctx.teamId!));
      const currentTemplate = (existing[0]?.template as Record<string, unknown> | undefined) ?? {};
      const nextTemplate = { ...currentTemplate, ...input.template } as Record<string, unknown>;
      if (existing[0]) {
        await ctx.db
          .update(invoiceTemplates)
          .set({ template: nextTemplate, updatedAt: new Date() })
          .where(eq(invoiceTemplates.teamId, ctx.teamId!));
      } else {
        await ctx.db
          .insert(invoiceTemplates)
          .values({ teamId: ctx.teamId!, template: nextTemplate, updatedAt: new Date() });
      }
      return { ok: true };
    }),
});
