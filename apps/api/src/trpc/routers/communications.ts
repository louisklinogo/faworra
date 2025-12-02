import {
  createMessage,
  getTeamAccounts,
  getThreadMessages,
  getThreadsByStatus,
  listThreadTags,
  updateThreadTags,
  getOwnershipCounts,
} from "@Faworra/database/queries";
import { serializeThreadRow } from "@Faworra/database/serializers/communications";
import { MessageMetaSchema } from "@Faworra/schemas";
import { z } from "zod";
import { createTRPCRouter, teamProcedure } from "../init";
import type { RTEvent } from "@Faworra/realtime";
import { buildConversationSnapshot } from "../../lib/conversation-snapshot";


const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;
const TEXT_MAX = 4096;

export const communicationsRouter = createTRPCRouter({
  ownershipCounts: teamProcedure
    .input(
      z.object({
        status: z.enum(["open", "pending", "resolved", "snoozed"]).default("open"),
        channel: z.enum(["whatsapp", "instagram", "email"]).optional(),
        accountId: z.string().uuid().optional(),
        tagIds: z.array(z.string().uuid()).optional().default([]),
        q: z.string().max(120).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { getOwnershipCounts } = await import("@Faworra/database/queries");
      const counts = await getOwnershipCounts(ctx.db, {
        teamId: ctx.teamId,
        status: input.status,
        channel: input.channel,
        accountId: input.accountId,
        tagIds: input.tagIds,
        q: input.q,
        currentUserId: ctx.userId,
      });
      return counts;
    }),
  accounts: teamProcedure.query(async ({ ctx }) => {
    const rows = await getTeamAccounts(ctx.db, ctx.teamId);
    return rows.map((r: any) => ({
      id: r.id,
      provider: r.provider,
      externalId: r.externalId,
      displayName: r.displayName,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }),
  accountConfig: teamProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { communicationAccounts, and, eq } = await import("@Faworra/database/schema");
      const [row] = await ctx.db
        .select({
          id: communicationAccounts.id,
          provider: communicationAccounts.provider,
          credentialsEncrypted: communicationAccounts.credentialsEncrypted,
          displayName: communicationAccounts.displayName,
        })
        .from(communicationAccounts)
        .where(
          and(
            eq(communicationAccounts.id, input.accountId),
            eq(communicationAccounts.teamId, ctx.teamId),
          ),
        );
      if (!row) {
        throw new Error("account not found");
      }
      let config: Record<string, unknown> | null = null;
      if (row.credentialsEncrypted) {
        try {
          const parsed = JSON.parse(row.credentialsEncrypted as unknown as string);
          if (parsed && typeof parsed === "object") config = parsed as Record<string, unknown>;
        } catch {
          config = null;
        }
      }
      return {
        provider: row.provider,
        displayName: row.displayName,
        config,
      };
    }),
  updateEmailConfig: teamProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        fromEmail: z.string().email(),
        fromName: z.string().min(1).max(120).optional(),
        replyTo: z.string().email().optional(),
        defaultSubject: z.string().min(1).max(240).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { communicationAccounts, and, eq } = await import("@Faworra/database/schema");
      const [row] = await ctx.db
        .select({
          id: communicationAccounts.id,
          provider: communicationAccounts.provider,
          credentialsEncrypted: communicationAccounts.credentialsEncrypted,
        })
        .from(communicationAccounts)
        .where(
          and(
            eq(communicationAccounts.id, input.accountId),
            eq(communicationAccounts.teamId, ctx.teamId),
          ),
        );
      if (!row) {
        throw new Error("account not found");
      }
      if (row.provider !== "email_resend" && !row.provider.includes("email")) {
        throw new Error("account does not support email configuration");
      }
      let current: Record<string, unknown> = {};
      if (row.credentialsEncrypted) {
        try {
          const parsed = JSON.parse(row.credentialsEncrypted as unknown as string);
          if (parsed && typeof parsed === "object") current = parsed as Record<string, unknown>;
        } catch {
          current = {};
        }
      }
      const next = { ...current };
      next.fromEmail = input.fromEmail;
      if (input.fromName !== undefined) {
        next.fromName = input.fromName;
      }
      if (input.replyTo !== undefined) {
        next.replyTo = input.replyTo || null;
      }
      if (input.defaultSubject !== undefined) {
        next.defaultSubject = input.defaultSubject || null;
      }

      await ctx.db
        .update(communicationAccounts)
        .set({
          credentialsEncrypted: JSON.stringify(next),
          status: "connected",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(communicationAccounts.id, input.accountId),
            eq(communicationAccounts.teamId, ctx.teamId),
          ),
        );
      return { success: true };
    }),
  templates: teamProcedure
    .input(
      z
        .object({
          provider: z.string().optional(),
          category: z.string().optional(),
          q: z.string().max(120).optional(),
          limit: z.number().int().min(1).max(50).optional(),
        })
        .optional()
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const { communicationTemplates, eq, and, ilike } = await import("@Faworra/database/schema");
      const conditions = [eq(communicationTemplates.teamId, ctx.teamId)];
      if (input.provider) {
        conditions.push(eq(communicationTemplates.provider, input.provider));
      }
      if (input.category) {
        conditions.push(eq(communicationTemplates.category, input.category));
      }
      if (input.q && input.q.trim()) {
        const likeValue = `%${input.q.trim()}%`;
        conditions.push(ilike(communicationTemplates.name, likeValue));
      }
      const whereClause = conditions.length === 1 ? conditions[0]! : and(...conditions);
      const rows = await ctx.db
        .select({
          id: communicationTemplates.id,
          name: communicationTemplates.name,
          body: communicationTemplates.body,
          provider: communicationTemplates.provider,
          category: communicationTemplates.category,
          variables: communicationTemplates.variables,
        })
        .from(communicationTemplates)
        .where(whereClause)
        .limit(input.limit ?? 20);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        body: row.body ?? "",
        provider: row.provider,
        category: row.category ?? null,
        variables: row.variables ?? null,
      }));
    }),
  articleSearch: teamProcedure
    .input(z.object({ q: z.string().min(2).max(120), limit: z.number().int().min(1).max(15).optional() }))
    .query(async ({ ctx, input }) => {
      const { documents, eq, and, ilike } = await import("@Faworra/database/schema");
      const rows = await ctx.db
        .select({
          id: documents.id,
          name: documents.name,
          metadata: documents.metadata,
          pathTokens: documents.pathTokens,
        })
        .from(documents)
        .where(and(eq(documents.teamId, ctx.teamId), ilike(documents.name, `%${input.q.trim()}%`)))
        .limit(input.limit ?? 8);
      return rows.map((row) => {
        const metadata = (row.metadata as Record<string, unknown> | null) || {};
        const url = typeof metadata?.url === "string" ? (metadata.url as string) : null;
        const summary =
          typeof metadata?.summary === "string"
            ? (metadata.summary as string)
            : Array.isArray(row.pathTokens)
              ? row.pathTokens
                  .filter((token): token is string => typeof token === "string")
                  .join(" / ")
              : null;
        return {
          id: row.id,
          title: row.name,
          url,
          summary,
        };
      });
    }),
  views: createTRPCRouter({
    list: teamProcedure.query(async ({ ctx }) => {
      const { savedInboxViews, eq } = await import("@Faworra/database/schema");
      return await ctx.db
        .select({ id: savedInboxViews.id, name: savedInboxViews.name, filter: savedInboxViews.filter, ownerUserId: savedInboxViews.ownerUserId })
        .from(savedInboxViews)
        .where(eq(savedInboxViews.teamId, ctx.teamId));
    }),
    byId: teamProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const { savedInboxViews, and, eq } = await import("@Faworra/database/schema");
        const [row] = await ctx.db
          .select({ id: savedInboxViews.id, name: savedInboxViews.name, filter: savedInboxViews.filter, ownerUserId: savedInboxViews.ownerUserId })
          .from(savedInboxViews)
          .where(and(eq(savedInboxViews.id, input.id), eq(savedInboxViews.teamId, ctx.teamId)))
          .limit(1);
        return row || null;
      }),
    create: teamProcedure
      .input(z.object({ name: z.string().min(1).max(100), filter: z.record(z.any()).optional() }))
      .mutation(async ({ ctx, input }) => {
        const { savedInboxViews } = await import("@Faworra/database/schema");
        const [row] = await ctx.db
          .insert(savedInboxViews)
          .values({ teamId: ctx.teamId, name: input.name, filter: (input.filter as any) ?? {}, ownerUserId: ctx.userId as any })
          .returning({ id: savedInboxViews.id, name: savedInboxViews.name, filter: savedInboxViews.filter });
        return row;
      }),
    update: teamProcedure
      .input(z.object({ id: z.string().uuid(), name: z.string().min(1).max(100).optional(), filter: z.record(z.any()).optional() }))
      .mutation(async ({ ctx, input }) => {
        const { savedInboxViews, and, eq } = await import("@Faworra/database/schema");
        const [row] = await ctx.db
          .update(savedInboxViews)
          .set({ name: input.name as any, filter: (input.filter as any) ?? undefined })
          .where(and(eq(savedInboxViews.id, input.id), eq(savedInboxViews.teamId, ctx.teamId)))
          .returning({ id: savedInboxViews.id, name: savedInboxViews.name, filter: savedInboxViews.filter });
        return row;
      }),
    delete: teamProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { savedInboxViews, and, eq } = await import("@Faworra/database/schema");
        await ctx.db.delete(savedInboxViews).where(and(eq(savedInboxViews.id, input.id), eq(savedInboxViews.teamId, ctx.teamId)));
        return { success: true };
      }),
  }),
  macros: createTRPCRouter({
    list: teamProcedure.query(async ({ ctx }) => {
      const { macros, eq } = await import("@Faworra/database/schema");
      return await ctx.db
        .select({ id: macros.id, name: macros.name, actions: macros.actions })
        .from(macros)
        .where(eq(macros.teamId, ctx.teamId));
    }),
    create: teamProcedure
      .input(z.object({ name: z.string().min(1).max(100), actions: z.array(z.unknown()).default([]) }))
      .mutation(async ({ ctx, input }) => {
        const { macros } = await import("@Faworra/database/schema");
        const [row] = await ctx.db
          .insert(macros)
          .values({ teamId: ctx.teamId, name: input.name, actions: input.actions as any })
          .returning({ id: macros.id, name: macros.name, actions: macros.actions });
        return row;
      }),
    delete: teamProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { macros, and, eq } = await import("@Faworra/database/schema");
        const [row] = await ctx.db
          .delete(macros)
          .where(and(eq(macros.id, input.id), eq(macros.teamId, ctx.teamId)))
          .returning({ id: macros.id });
        return row;
      }),
    execute: teamProcedure
      .input(z.object({ threadId: z.string().uuid(), macroId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { macros, communicationThreads, and, eq } = await import("@Faworra/database/schema");
        const macro = await ctx.db
          .select({ id: macros.id, actions: macros.actions })
          .from(macros)
          .where(and(eq(macros.id, input.macroId), eq(macros.teamId, ctx.teamId)))
          .limit(1);
        const m = macro[0];
        if (!m) {
          throw new Error('macro not found');
        }
        const actions: Array<any> = (m.actions as any) || [];

        // Fetch thread for outbound send
        const threadRows = await ctx.db
          .select({ id: communicationThreads.id, teamId: communicationThreads.teamId, accountId: communicationThreads.accountId, externalContactId: communicationThreads.externalContactId })
          .from(communicationThreads)
          .where(and(eq(communicationThreads.id, input.threadId), eq(communicationThreads.teamId, ctx.teamId)))
          .limit(1);
        const thread = threadRows[0];
        if (!thread) throw new Error('thread not found');

        for (const a of actions) {
          if (!a || typeof a.type !== 'string') continue;
          if (a.type === 'set_status' && a.status) {
            await ctx.db
              .update(communicationThreads)
              .set({ status: a.status as any, updatedAt: new Date() })
              .where(and(eq(communicationThreads.id, thread.id), eq(communicationThreads.teamId, ctx.teamId)));
          } else if (a.type === 'assign' && 'assignedUserId' in a) {
            await ctx.db
              .update(communicationThreads)
              .set({ assignedUserId: (a.assignedUserId as string) ?? null, updatedAt: new Date() })
              .where(and(eq(communicationThreads.id, thread.id), eq(communicationThreads.teamId, ctx.teamId)));
          } else if (a.type === 'add_tags' && Array.isArray(a.tagIds)) {
            await updateThreadTags(ctx.db, ctx.teamId, thread.id, a.tagIds as string[]);
          } else if (a.type === 'send_template' && a.templateId) {
            const { enqueueCommunicationOutbox } = await import("@Faworra/supabase/mutations");
            // Enqueue a message with empty content; actual body is resolved in worker via templateId if supported
            await enqueueCommunicationOutbox(ctx.supabase, {
              team_id: thread.teamId as any,
              account_id: thread.accountId as any,
              recipient: thread.externalContactId as any,
              status: 'queued',
              content: '',
              client_message_id: undefined,
            } as any);
          }
        }
        return { success: true };
      }),
  }),
  disconnect: teamProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { and, eq, communicationAccounts } = await import("@Faworra/database/schema");
      await ctx.db
        .update(communicationAccounts)
        .set({ status: "disconnected", credentialsEncrypted: null, updatedAt: new Date() })
        .where(and(eq(communicationAccounts.id, input.accountId), eq(communicationAccounts.teamId, ctx.teamId)));
      return { success: true };
    }),
  reconnect: teamProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { and, eq, communicationAccounts } = await import("@Faworra/database/schema");
      await ctx.db
        .update(communicationAccounts)
        .set({ status: "connecting", credentialsEncrypted: null, updatedAt: new Date() })
        .where(and(eq(communicationAccounts.id, input.accountId), eq(communicationAccounts.teamId, ctx.teamId)));
      return { success: true };
    }),
  delete: teamProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { and, eq, communicationAccounts } = await import("@Faworra/database/schema");
      await ctx.db
        .delete(communicationAccounts)
        .where(and(eq(communicationAccounts.id, input.accountId), eq(communicationAccounts.teamId, ctx.teamId)));
      return { success: true };
    }),
  canned: createTRPCRouter({
    list: teamProcedure.query(async ({ ctx }) => {
      const { communicationTemplates, and, eq } = await import("@Faworra/database/schema");
      const rows = await ctx.db
        .select({ id: communicationTemplates.id, name: communicationTemplates.name, body: communicationTemplates.body })
        .from(communicationTemplates)
        .where(and(eq(communicationTemplates.teamId, ctx.teamId), eq(communicationTemplates.category, "canned" as any)))
        .orderBy(communicationTemplates.name as any);
      return rows;
    }),
  }),
  threadsByStatus: teamProcedure
    .input(
      z.object({
        status: z.enum(["open", "pending", "resolved", "snoozed"]).default("open"),
        sort: z.enum(["asc", "desc"]).optional().default("desc"),
        limit: z.number().int().min(MIN_LIMIT).max(MAX_LIMIT).optional().default(DEFAULT_LIMIT),
        cursor: z
          .object({ lastMessageAt: z.string().nullable(), id: z.string() })
          .nullable()
          .optional(),
        // optional filters
        channel: z.enum(["whatsapp", "instagram", "email"]).optional(),
        accountId: z.string().uuid().optional(),
        // When null → filter for unassigned threads; when string → filter by that user; when undefined → no filter
        assigneeId: z.string().uuid().nullable().optional(),
        tagIds: z.array(z.string().uuid()).optional().default([]),
        q: z.string().max(120).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const useTagFilter = (input.tagIds?.length ?? 0) > 0;
      const fetchLimit = useTagFilter ? (input.limit ?? DEFAULT_LIMIT) * 3 : input.limit;

      const rows = await getThreadsByStatus(ctx.db, {
        teamId: ctx.teamId,
        status: input.status,
        limit: fetchLimit ?? DEFAULT_LIMIT,
        cursor: input.cursor
          ? {
              lastMessageAt: input.cursor.lastMessageAt
                ? new Date(input.cursor.lastMessageAt)
                : null,
              id: input.cursor.id,
            }
          : null,
        channel: input.channel,
        accountId: input.accountId,
        assigneeId: input.assigneeId,
        tagIds: input.tagIds,
        q: input.q,
        sort: input.sort,
      });

      // Deduplicate by thread id when tag filter introduces duplicates
      const orderedMap = new Map<string, any>();
      for (const r of rows) {
        const tid = (r as any).thread.id as string;
        if (!orderedMap.has(tid)) {
          orderedMap.set(tid, r);
        }
      }
      const deduped = Array.from(orderedMap.values());

      const sliced = deduped.slice(0, input.limit ?? DEFAULT_LIMIT);

      const items = sliced.map((row: any) => {
        const tagsValue = row.tags_json ?? row.tagsJson ?? "[]";
        let tags: Array<{ id: string; name: string; color: string | null }> = [];
        try {
          tags = typeof tagsValue === "string" ? JSON.parse(tagsValue) : tagsValue ?? [];
        } catch {
          tags = [];
        }
        const latestValue = row.latest_message_json ?? row.latestMessageJson ?? null;
        let latest: any;
        try {
          latest = latestValue
            ? typeof latestValue === "string"
              ? JSON.parse(latestValue)
              : latestValue
            : undefined;
        } catch {
          latest = undefined;
        }
        const unreadRaw = row.unread_count ?? row.unreadCount ?? 0;
        return serializeThreadRow(row, {
          latestMessage: latest,
          unreadCount: typeof unreadRaw === "number" ? unreadRaw : Number(unreadRaw) || 0,
          tags,
        });
      });

      const last = items.at(-1) || null;
      const nextCursor = last
        ? {
            lastMessageAt: last.lastMessageAt,
            id: last.id,
          }
        : null;

      const ownership = await getOwnershipCounts(ctx.db, {
        teamId: ctx.teamId,
        status: input.status,
        channel: input.channel,
        accountId: input.accountId,
        tagIds: input.tagIds,
        q: input.q,
        currentUserId: ctx.userId,
      });

      return {
        status: input.status,
        items,
        nextCursor,
        ownership,
      };
    }),
  threads: createTRPCRouter({
    markAllRead: teamProcedure
      .input(
        z.object({
          status: z.enum(["open", "pending", "resolved", "snoozed"]).default("open"),
          channel: z.enum(["whatsapp", "instagram", "email"]).optional(),
          accountId: z.string().uuid().optional(),
          assigneeId: z.string().uuid().nullable().optional(),
          tagIds: z.array(z.string().uuid()).optional().default([]),
          q: z.string().max(120).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { markAllReadByFilter } = await import("@Faworra/database/queries");
        const count = await markAllReadByFilter(ctx.db, {
          teamId: ctx.teamId,
          status: input.status,
          channel: input.channel,
          accountId: input.accountId,
          assigneeId: input.assigneeId,
          tagIds: input.tagIds,
          q: input.q,
        });
        return { count };
      }),
    archiveAllRead: teamProcedure
      .input(
        z.object({
          status: z.enum(["open", "pending", "resolved", "snoozed"]).default("open"),
          channel: z.enum(["whatsapp", "instagram", "email"]).optional(),
          accountId: z.string().uuid().optional(),
          assigneeId: z.string().uuid().nullable().optional(),
          tagIds: z.array(z.string().uuid()).optional().default([]),
          q: z.string().max(120).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { archiveThreadsByFilter } = await import("@Faworra/database/queries");
        const count = await archiveThreadsByFilter(
          ctx.db,
          {
            teamId: ctx.teamId,
            status: input.status,
            channel: input.channel,
            accountId: input.accountId,
            assigneeId: input.assigneeId,
            tagIds: input.tagIds,
            q: input.q,
          },
          true,
        );
        return { count };
      }),
    archiveAll: teamProcedure
      .input(
        z.object({
          status: z.enum(["open", "pending", "resolved", "snoozed"]).default("open"),
          channel: z.enum(["whatsapp", "instagram", "email"]).optional(),
          accountId: z.string().uuid().optional(),
          assigneeId: z.string().uuid().nullable().optional(),
          tagIds: z.array(z.string().uuid()).optional().default([]),
          q: z.string().max(120).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { archiveThreadsByFilter } = await import("@Faworra/database/queries");
        const count = await archiveThreadsByFilter(
          ctx.db,
          {
            teamId: ctx.teamId,
            status: input.status,
            channel: input.channel,
            accountId: input.accountId,
            assigneeId: input.assigneeId,
            tagIds: input.tagIds,
            q: input.q,
          },
          false,
        );
        return { count };
      }),
    delete: teamProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteThreads } = await import("@Faworra/database/queries");
        await deleteThreads(ctx.db as any, ctx.teamId, [input.id]);
        return { success: true };
      }),
    bulkDelete: teamProcedure
      .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
      .mutation(async ({ ctx, input }) => {
        const { deleteThreads } = await import("@Faworra/database/queries");
        await deleteThreads(ctx.db as any, ctx.teamId, input.ids);
        return { success: true };
      }),
    update: teamProcedure
      .input(
        z
          .object({
            id: z.string().uuid(),
            status: z.enum(["open", "pending", "resolved", "snoozed"]).optional(),
            assignedUserId: z.string().uuid().nullable().optional(),
            tagIds: z.array(z.string().uuid()).optional(),
            snoozedUntil: z.string().datetime().nullable().optional(),
          })
          .refine((d) => d.status !== undefined || d.assignedUserId !== undefined || d.tagIds, {
            message: "Provide at least one field to update",
          }),
      )
      .mutation(async ({ ctx, input }) => {
        const { and, eq, communicationThreads } = await import("@Faworra/database/schema");
        // Load previous for change detection
        const [prev] = await ctx.db
          .select({ assignedUserId: communicationThreads.assignedUserId, accountId: communicationThreads.accountId })
          .from(communicationThreads)
          .where(and(eq(communicationThreads.id, input.id), eq(communicationThreads.teamId, ctx.teamId)));

        if (
          input.status !== undefined ||
          input.assignedUserId !== undefined ||
          input.snoozedUntil !== undefined
        ) {
          await ctx.db
            .update(communicationThreads)
            .set({
              status: input.status as any,
              assignedUserId:
                (input.assignedUserId === null ? null : (input.assignedUserId as any)) ?? undefined,
              snoozedUntil:
                input.snoozedUntil === undefined
                  ? undefined
                  : (input.snoozedUntil as any),
              updatedAt: new Date(),
            })
            .where(
              and(eq(communicationThreads.id, input.id), eq(communicationThreads.teamId, ctx.teamId)),
            );
        }

        if (Array.isArray(input.tagIds)) {
          await updateThreadTags(ctx.db, ctx.teamId, input.id, input.tagIds);
        }

        // Broadcast conversation updated snapshot (and status_changed / assignee.changed when relevant)
        try {
          const convo = await buildConversationSnapshot(ctx.db, ctx.teamId!, input.id);
          if (convo) {
            await ctx.eventBus.publish({ type: "conversation.updated", teamId: ctx.teamId!, threadId: input.id, conversation: convo } as RTEvent);
            if (input.status !== undefined) {
              await ctx.eventBus.publish({ type: "conversation.status_changed", teamId: ctx.teamId!, threadId: input.id, conversation: convo } as RTEvent);
            }
            if (input.assignedUserId !== undefined && prev?.assignedUserId !== input.assignedUserId) {
              await ctx.eventBus.publish({ type: "assignee.changed", teamId: ctx.teamId!, threadId: input.id, conversation: convo } as RTEvent);
            }
          }
          // counts snapshot (open tab)
          // Chatwoot pattern: clients refresh list on conversation events; no counts push
        } catch {}

        return { success: true };
      }),
  }),
  threadTags: createTRPCRouter({
    list: teamProcedure
      .input(z.object({ threadId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const rows = await listThreadTags(ctx.db, ctx.teamId, input.threadId);
        return rows.map((r) => ({ id: r.id, name: r.name, color: r.color }));
      }),
    update: teamProcedure
      .input(z.object({ threadId: z.string().uuid(), tagIds: z.array(z.string().uuid()) }))
      .mutation(async ({ ctx, input }) => {
        const rows = await updateThreadTags(ctx.db, ctx.teamId, input.threadId, input.tagIds);
        return rows.map((r) => ({ id: r.id, name: r.name, color: r.color }));
      }),
  }),
  messages: createTRPCRouter({
    list: teamProcedure
      .input(
        z.object({
          threadId: z.string().uuid(),
          limit: z.number().int().min(MIN_LIMIT).max(MAX_LIMIT).optional().default(DEFAULT_LIMIT),
        }),
      )
      .query(async ({ input, ctx }) => {
        const messages = await getThreadMessages(ctx.db, input.threadId, ctx.teamId, input.limit);
        return messages.map((m: any) => ({
          id: m.id,
          threadId: m.threadId,
          direction: m.direction,
          type: m.type,
          content: m.content,
          createdAt: m.createdAt,
          deliveredAt: m.deliveredAt,
          readAt: m.readAt,
          status: m.status,
          meta: m.meta,
        }));
      }),
    markRead: teamProcedure
      .input(z.object({ threadId: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const { and, eq, isNull, communicationMessages } = await import("@Faworra/database/schema");
        await ctx.db
          .update(communicationMessages)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(communicationMessages.teamId, ctx.teamId),
              eq(communicationMessages.threadId, input.threadId),
              eq(communicationMessages.direction as any, "in" as any),
              isNull(communicationMessages.readAt),
            ),
          );
        // Broadcast read + conversation snapshot
        try {
          await ctx.eventBus.publish({ type: "message.read", teamId: ctx.teamId!, threadId: input.threadId } as RTEvent);
          const convo = await buildConversationSnapshot(ctx.db, ctx.teamId!, input.threadId);
          if (convo) {
            await ctx.eventBus.publish({ type: "conversation.read", teamId: ctx.teamId!, threadId: input.threadId, conversation: convo } as RTEvent);
          }
          // Chatwoot pattern: clients refresh list on conversation events; no counts push
        } catch {}
        return { success: true };
      }),
    send: teamProcedure
      .input(
        z.object({
          threadId: z.string().uuid(),
          text: z.string().min(1).max(TEXT_MAX),
          clientMessageId: z.string().optional(),
          privateNote: z.boolean().optional().default(false),
          meta: MessageMetaSchema,
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const messageMeta: Record<string, unknown> = input.meta ? { ...input.meta } : {};
        if (input.privateNote) {
          messageMeta.privateNote = true;
        }
        const metaPayload = Object.keys(messageMeta).length ? (messageMeta as any) : undefined;
        const message = await createMessage(ctx.db, {
          id: undefined,
          threadId: input.threadId,
          teamId: ctx.teamId,
          direction: "out",
          type: "text",
          content: input.text,
          clientMessageId: input.clientMessageId,
          meta: metaPayload,
          status: "queued",
        });
        // Broadcast creation event + conversation snapshot
        try {
          await ctx.eventBus.publish({
            type: "message.created",
            teamId: ctx.teamId!,
            threadId: input.threadId,
            message: {
              id: message.id,
              threadId: message.threadId,
              direction: message.direction,
              type: message.type as any,
              content: message.content,
              createdAt: message.createdAt,
              deliveredAt: message.deliveredAt,
              readAt: message.readAt,
              status: message.status,
              meta: message.meta,
            },
          } as RTEvent);
          const convo = await buildConversationSnapshot(ctx.db, ctx.teamId!, input.threadId);
          if (convo) {
            await ctx.eventBus.publish({ type: "conversation.updated", teamId: ctx.teamId!, threadId: input.threadId, conversation: convo } as RTEvent);
          }
          // Chatwoot pattern: clients refresh list on conversation events; no counts push
        } catch {}
        return message;
      }),
  }),
});
