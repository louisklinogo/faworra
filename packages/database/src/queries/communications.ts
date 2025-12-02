import { and, asc, desc, eq, ilike, inArray, isNull, lt, or, sql, count } from "drizzle-orm";
import type { DbClient } from "../client";
import {
  clients,
  communicationAccounts,
  communicationMessages,
  communicationThreads,
  communicationThreadTags,
  instagramContacts,
  leads,
  tags,
  whatsappContacts,
} from "../schema";

/**
 * Get all threads for a team with latest message
 */
export async function getThreadsWithLatestMessage(db: DbClient, teamId: string) {
  return await db
    .select({
      thread: communicationThreads,
      account: communicationAccounts,
    })
    .from(communicationThreads)
    .leftJoin(communicationAccounts, eq(communicationThreads.accountId, communicationAccounts.id))
    .where(eq(communicationThreads.teamId, teamId))
    .orderBy(desc(communicationThreads.lastMessageAt));
}

/**
 * Get threads by status with account and optional linked client info
 */
export async function getThreadsByStatus(
  db: DbClient,
  params: {
    teamId: string;
    status: string;
    sort?: "asc" | "desc";
    limit?: number;
    cursor?: { lastMessageAt: Date | null; id: string } | null;
    // optional filters
    channel?: string; // whatsapp | instagram
    accountId?: string;
    // When null → unassigned; string → user id; undefined → no filter
    assigneeId?: string | null;
    tagIds?: string[];
    q?: string;
  },
) {
  const { teamId, status, cursor } = params;
  const limit = Math.max(1, Math.min(params.limit ?? 50, 200));

  const baseWhere = and(
    eq(communicationThreads.teamId, teamId),
    eq(communicationThreads.status, status),
  );

  // Build optional filters
  const optConds = [baseWhere];
  if (params.channel) {
    optConds.push(eq(communicationThreads.channel, params.channel));
  }
  if (params.accountId) {
    optConds.push(eq(communicationThreads.accountId, params.accountId));
  }
  if (params.assigneeId === null) {
    optConds.push(isNull(communicationThreads.assignedUserId));
  } else if (params.assigneeId) {
    optConds.push(eq(communicationThreads.assignedUserId, params.assigneeId));
  }
  if (params.q && params.q.trim()) {
    const q = `%${params.q.trim()}%`;
    optConds.push(
      or(
        ilike(clients.name, q),
        ilike(clients.whatsapp, q as any),
        ilike(communicationThreads.externalContactId, q),
      ),
    );
  }

  // If tagIds specified, join thread_tags and filter by tag list
  const joinTagFilter = Array.isArray(params.tagIds) && params.tagIds.length > 0;

  const qBuilder = db
    .select({
      thread: communicationThreads,
      account: communicationAccounts,
      client: clients,
      whatsappContact: whatsappContacts,
      instagramContact: instagramContacts,
      lead: leads,
      tagsJson: sql`(
        SELECT coalesce(
          json_agg(
            json_build_object(
              'id', ctt.tag_id,
              'name', t.name,
              'color', t.color
            )
            ORDER BY t.name
          ),
          '[]'::json
        )
        FROM communication_thread_tags ctt
        JOIN tags t ON t.id = ctt.tag_id AND t.team_id = ctt.team_id
        WHERE ctt.team_id = ${communicationThreads.teamId}
          AND ctt.thread_id = ${communicationThreads.id}
      )`.as("tags_json"),
      latestMessageJson: sql`(
        SELECT json_build_object(
          'content', cm.content,
          'direction', cm.direction,
          'createdAt', cm.created_at,
          'meta', cm.meta,
          'status', cm.status
        )
        FROM communication_messages cm
        WHERE cm.team_id = ${communicationThreads.teamId}
          AND cm.thread_id = ${communicationThreads.id}
        ORDER BY cm.created_at DESC
        LIMIT 1
      )`.as("latest_message_json"),
      unreadCount: sql<number>`(
        SELECT count(*)
        FROM communication_messages cm
        WHERE cm.team_id = ${communicationThreads.teamId}
          AND cm.thread_id = ${communicationThreads.id}
          AND cm.direction = 'in'
          AND cm.read_at IS NULL
      )`.as("unread_count"),
    })
    .from(communicationThreads)
    .leftJoin(communicationAccounts, eq(communicationThreads.accountId, communicationAccounts.id))
    .leftJoin(clients, eq(communicationThreads.customerId, clients.id))
    .leftJoin(whatsappContacts, eq(communicationThreads.whatsappContactId, whatsappContacts.id))
    .leftJoin(
      instagramContacts,
      eq(communicationThreads.instagramContactId, instagramContacts.id),
    )
    .leftJoin(
      leads,
      and(
        eq(leads.teamId, communicationThreads.teamId),
        eq(leads.threadId, communicationThreads.id),
      ),
    );

  if (joinTagFilter) {
    qBuilder.leftJoin(
      communicationThreadTags,
      and(
        eq(communicationThreadTags.threadId, communicationThreads.id),
        eq(communicationThreadTags.teamId, communicationThreads.teamId),
        inArray(communicationThreadTags.tagId, params.tagIds!),
      ),
    );
  }

  // If FTS query provided, join messages and filter by tsvector match
  if (params.q && params.q.trim()) {
    qBuilder.leftJoin(
      communicationMessages,
      and(
        eq(communicationMessages.threadId, communicationThreads.id),
        eq(communicationMessages.teamId, communicationThreads.teamId),
      ),
    );
  }

  const whereWithCursor = cursor?.lastMessageAt
    ? and(
        ...optConds,
        or(
          lt(communicationThreads.lastMessageAt, cursor.lastMessageAt),
          and(
            eq(communicationThreads.lastMessageAt, cursor.lastMessageAt),
            lt(communicationThreads.id, cursor.id),
          ),
        ),
      )
    : and(...optConds);

  const rows = await qBuilder
    .where(
      params.q && params.q.trim()
        ? and(
            whereWithCursor,
            sql`${communicationMessages.searchTsv} @@ plainto_tsquery('simple', ${params.q!.trim()})`,
          )
        : whereWithCursor,
    )
    .orderBy(
      (params.sort ?? "desc") === "asc"
        ? (communicationThreads.lastMessageAt as any)
        : (desc(communicationThreads.lastMessageAt) as any),
      (params.sort ?? "desc") === "asc"
        ? (communicationThreads.id as any)
        : (desc(communicationThreads.id) as any),
    )
    .limit(limit);

  return rows;
}

/**
 * Latest message for each thread in list (simple approach ordering by createdAt desc)
 */
export async function getLatestMessagesForThreads(
  db: DbClient,
  teamId: string,
  threadIds: string[],
) {
  if (!threadIds.length) return new Map<string, { content: string | null; createdAt: Date; direction: string }>();
  const rows = await db
    .select({
      id: communicationMessages.id,
      threadId: communicationMessages.threadId,
      content: communicationMessages.content,
      createdAt: communicationMessages.createdAt,
      direction: communicationMessages.direction,
    })
    .from(communicationMessages)
    .where(and(eq(communicationMessages.teamId, teamId), inArray(communicationMessages.threadId, threadIds)))
    .orderBy(desc(communicationMessages.threadId), desc(communicationMessages.createdAt));
  const map = new Map<string, { content: string | null; createdAt: Date; direction: string }>();
  for (const r of rows) {
    if (!map.has(r.threadId)) map.set(r.threadId, { content: r.content as any, createdAt: r.createdAt as any, direction: r.direction as any });
  }
  return map;
}

/**
 * Unread inbound message counts per thread
 */
export async function getUnreadCountsForThreads(
  db: DbClient,
  teamId: string,
  threadIds: string[],
) {
  if (!threadIds.length) return new Map<string, number>();
  const rows = await db
    .select({
      threadId: communicationMessages.threadId,
      c: sql<number>`count(*)` as unknown as any,
    })
    .from(communicationMessages)
    .where(
      and(
        eq(communicationMessages.teamId, teamId),
        inArray(communicationMessages.threadId, threadIds),
        eq(communicationMessages.direction as any, "in" as any),
        isNull(communicationMessages.readAt),
      ),
    )
    .groupBy(communicationMessages.threadId);
  const map = new Map<string, number>();
  for (const r of rows as any[]) {
    map.set(r.threadId, Number(r.c) || 0);
  }
  return map;
}

/**
 * Get messages for a thread
 */
export async function getThreadMessages(
  db: DbClient,
  threadId: string,
  teamId: string,
  limit = 100,
) {
  return await db
    .select()
    .from(communicationMessages)
    .where(
      and(eq(communicationMessages.threadId, threadId), eq(communicationMessages.teamId, teamId)),
    )
    .orderBy(asc(communicationMessages.createdAt))
    .limit(limit);
}

/**
 * Create a new message
 */
export async function createMessage(db: DbClient, data: typeof communicationMessages.$inferInsert) {
  const result = await db.insert(communicationMessages).values(data).returning();
  return result[0];
}

/**
 * Get communication accounts for a team
 */
export async function getTeamAccounts(db: DbClient, teamId: string) {
  return await db
    .select()
    .from(communicationAccounts)
    .where(eq(communicationAccounts.teamId, teamId))
    .orderBy(desc(communicationAccounts.createdAt));
}

/**
 * Fetch tags for a list of threads (used to decorate list rows)
 */
export async function getTagsForThreads(
  db: DbClient,
  teamId: string,
  threadIds: string[],
) {
  if (!threadIds.length) return [] as Array<{ threadId: string; tagId: string; name: string; color: string | null }>;
  return await db
    .select({
      threadId: communicationThreadTags.threadId,
      tagId: communicationThreadTags.tagId,
      name: tags.name,
      color: tags.color,
    })
    .from(communicationThreadTags)
    .innerJoin(tags, and(eq(tags.id, communicationThreadTags.tagId), eq(tags.teamId, teamId)))
    .where(and(eq(communicationThreadTags.teamId, teamId), inArray(communicationThreadTags.threadId, threadIds)));
}

/**
 * List tags for a single thread
 */
export async function listThreadTags(db: DbClient, teamId: string, threadId: string) {
  return await db
    .select({ id: tags.id, name: tags.name, color: tags.color })
    .from(communicationThreadTags)
    .innerJoin(tags, and(eq(tags.id, communicationThreadTags.tagId), eq(tags.teamId, teamId)))
    .where(and(eq(communicationThreadTags.teamId, teamId), eq(communicationThreadTags.threadId, threadId)));
}

/**
 * Replace thread tags with provided set (idempotent)
 */
export async function updateThreadTags(
  db: DbClient,
  teamId: string,
  threadId: string,
  tagIds: string[],
) {
  // Get existing
  const existing = await db
    .select({ tagId: communicationThreadTags.tagId })
    .from(communicationThreadTags)
    .where(and(eq(communicationThreadTags.teamId, teamId), eq(communicationThreadTags.threadId, threadId)));
  const existingIds = new Set(existing.map((r) => r.tagId));
  const desired = new Set(tagIds);

  // To insert: in desired but not in existing
  const toInsert = [...desired].filter((id) => !existingIds.has(id));
  if (toInsert.length) {
    await db.insert(communicationThreadTags).values(
      toInsert.map((tagId) => ({ teamId, threadId, tagId })),
    );
  }

  // To delete: in existing but not desired
  const toDelete = [...existingIds].filter((id) => !desired.has(id));
  if (toDelete.length) {
    await db
      .delete(communicationThreadTags)
      .where(
        and(
          eq(communicationThreadTags.teamId, teamId),
          eq(communicationThreadTags.threadId, threadId),
          inArray(communicationThreadTags.tagId, toDelete),
        ),
      );
  }

  return await listThreadTags(db, teamId, threadId);
}

/**
 * Hard delete threads for a team. Cascades to messages and thread_tags per FK.
 */
export async function deleteThreads(
  db: DbClient,
  teamId: string,
  threadIds: string[],
) {
  if (!threadIds.length) return 0;
  const res = await db
    .delete(communicationThreads)
    .where(and(eq(communicationThreads.teamId, teamId), inArray(communicationThreads.id, threadIds)));
  // drizzle returns undefined for delete; return count via follow-up (optional), skipping for perf
  return threadIds.length;
}

/**
 * Archive (resolve) threads matching current filters across the full result set.
 * When onlyRead is true, only archives threads with ZERO unread inbound messages.
 * Returns number of threads updated.
 */
export async function archiveThreadsByFilter(
  db: DbClient,
  params: {
    teamId: string;
    status: string; // open|pending|resolved|snoozed (current list tab)
    channel?: string; // whatsapp|instagram
    accountId?: string;
    assigneeId?: string | null; // null for unassigned; string for user; undefined = all
    tagIds?: string[];
    q?: string;
  },
  onlyRead: boolean,
) {
  const { teamId } = params;

  // Build base WHERE conditions reusing the same semantics as getThreadsByStatus
  const conds: any[] = [and(eq(communicationThreads.teamId, teamId), eq(communicationThreads.status, params.status))];
  if (params.channel) conds.push(eq(communicationThreads.channel, params.channel));
  if (params.assigneeId === null) conds.push(isNull(communicationThreads.assignedUserId));
  else if (typeof params.assigneeId === "string") conds.push(eq(communicationThreads.assignedUserId, params.assigneeId));
  if (params.accountId) conds.push(eq(communicationThreads.accountId, params.accountId));

  const joinTagFilter = Array.isArray(params.tagIds) && params.tagIds.length > 0;
  const useQ = params.q && params.q.trim();

  // Select matching thread ids (deduped) using the same joins as list query
  const qBuilder = db
    .select({ id: communicationThreads.id })
    .from(communicationThreads)
    .leftJoin(clients, eq(communicationThreads.customerId, clients.id));

  if (joinTagFilter) {
    qBuilder.leftJoin(
      communicationThreadTags,
      and(
        eq(communicationThreadTags.threadId, communicationThreads.id),
        eq(communicationThreadTags.teamId, communicationThreads.teamId),
        inArray(communicationThreadTags.tagId, params.tagIds!),
      ),
    );
  }

  if (useQ) {
    qBuilder.leftJoin(
      communicationMessages,
      and(
        eq(communicationMessages.threadId, communicationThreads.id),
        eq(communicationMessages.teamId, communicationThreads.teamId),
      ),
    );
  }

  const whereExpr = and(...conds);
  const filteredRows = await qBuilder.where(
    useQ
      ? and(whereExpr, sql`${communicationMessages.searchTsv} @@ plainto_tsquery('simple', ${params.q!.trim()})`)
      : whereExpr,
  );

  // Dedupe ids
  const idSet = new Set<string>();
  for (const r of filteredRows) idSet.add((r as any).id as string);
  let ids = Array.from(idSet);

  if (!ids.length) return 0;

  if (onlyRead) {
    // Filter out threads that still have unread inbound messages
    const unreadMap = await getUnreadCountsForThreads(db, teamId, ids);
    ids = ids.filter((id) => (unreadMap.get(id) ?? 0) === 0);
    if (!ids.length) return 0;
  }

  await db
    .update(communicationThreads)
    .set({ status: "resolved" as any, updatedAt: new Date() })
    .where(and(eq(communicationThreads.teamId, teamId), inArray(communicationThreads.id, ids)));

  return ids.length;
}

/**
 * Mark all inbound messages as read for threads matching current filters across the full result set.
 * Returns number of messages updated.
 */
export async function markAllReadByFilter(
  db: DbClient,
  params: {
    teamId: string;
    status: string;
    channel?: string;
    accountId?: string;
    assigneeId?: string | null;
    tagIds?: string[];
    q?: string;
  },
) {
  const { teamId } = params;
  const conds: any[] = [and(eq(communicationThreads.teamId, teamId), eq(communicationThreads.status, params.status))];
  if (params.channel) conds.push(eq(communicationThreads.channel, params.channel));
  if (params.accountId) conds.push(eq(communicationThreads.accountId, params.accountId));
  if (params.assigneeId === null) conds.push(isNull(communicationThreads.assignedUserId));
  else if (typeof params.assigneeId === "string") conds.push(eq(communicationThreads.assignedUserId, params.assigneeId));

  const joinTagFilter = Array.isArray(params.tagIds) && params.tagIds.length > 0;
  const useQ = params.q && params.q.trim();

  const qBuilder = db
    .select({ id: communicationThreads.id })
    .from(communicationThreads)
    .leftJoin(clients, eq(communicationThreads.customerId, clients.id));

  if (joinTagFilter) {
    qBuilder.leftJoin(
      communicationThreadTags,
      and(
        eq(communicationThreadTags.threadId, communicationThreads.id),
        eq(communicationThreadTags.teamId, communicationThreads.teamId),
        inArray(communicationThreadTags.tagId, params.tagIds!),
      ),
    );
  }

  if (useQ) {
    qBuilder.leftJoin(
      communicationMessages,
      and(
        eq(communicationMessages.threadId, communicationThreads.id),
        eq(communicationMessages.teamId, communicationThreads.teamId),
      ),
    );
  }

  const whereExpr = and(...conds);
  const filteredRows = await qBuilder.where(
    useQ
      ? and(whereExpr, sql`${communicationMessages.searchTsv} @@ plainto_tsquery('simple', ${params.q!.trim()})`)
      : whereExpr,
  );

  const ids = filteredRows.map((r) => (r as any).id as string);
  if (!ids.length) return 0;

  // Mark inbound unread messages as read
  const now = new Date();
  const res = await db
    .update(communicationMessages)
    .set({ readAt: now as any })
    .where(
      and(
        eq(communicationMessages.teamId, teamId),
        inArray(communicationMessages.threadId, ids),
        eq(communicationMessages.direction as any, "in" as any),
        isNull(communicationMessages.readAt),
      ),
    )
    .returning({ id: communicationMessages.id });

  return (res as any[]).length;
}

/**
 * Ownership counts for current filters (without ownership filter applied)
 * Returns: { all, unassigned, mine }
 */
export async function getOwnershipCounts(
  db: DbClient,
  params: {
    teamId: string;
    status: string;
    channel?: string;
    accountId?: string;
    tagIds?: string[];
    q?: string;
    currentUserId?: string;
  },
) {
  const { teamId } = params;
  const whereBase = [eq(communicationThreads.teamId, teamId), eq(communicationThreads.status, params.status)];
  if (params.channel) {
    whereBase.push(eq(communicationThreads.channel, params.channel));
  }
  if (params.accountId) {
    whereBase.push(eq(communicationThreads.accountId, params.accountId));
  }

  const joinTagFilter = Array.isArray(params.tagIds) && params.tagIds.length > 0;
  const useQ = params.q && params.q.trim();

  const qb = db
    .select({
      all: sql<number>`count(distinct ${communicationThreads.id})`,
      unassigned: sql<number>`count(distinct case when ${communicationThreads.assignedUserId} is null then ${communicationThreads.id} end)`,
      mine: params.currentUserId
        ? sql<number>`count(distinct case when ${communicationThreads.assignedUserId} = ${params.currentUserId} then ${communicationThreads.id} end)`
        : sql<number>`0`,
    })
    .from(communicationThreads)
    .leftJoin(clients, eq(communicationThreads.customerId, clients.id));

  if (joinTagFilter) {
    qb.leftJoin(
      communicationThreadTags,
      and(
        eq(communicationThreadTags.threadId, communicationThreads.id),
        eq(communicationThreadTags.teamId, communicationThreads.teamId),
        inArray(communicationThreadTags.tagId, params.tagIds!),
      ),
    );
  }

  if (useQ) {
    qb.leftJoin(
      communicationMessages,
      and(
        eq(communicationMessages.threadId, communicationThreads.id),
        eq(communicationMessages.teamId, communicationThreads.teamId),
      ),
    );
  }

  const whereExpr = and(...whereBase);
  const rows = await qb.where(
    useQ
      ? and(
          whereExpr,
          sql`${communicationMessages.searchTsv} @@ plainto_tsquery('simple', ${params.q!.trim()})`,
        )
      : whereExpr,
  );
  const row = rows[0] as any;
  return {
    all: Number(row?.all ?? 0),
    unassigned: Number(row?.unassigned ?? 0),
    mine: Number(row?.mine ?? 0),
  } as { all: number; unassigned: number; mine: number };
}
