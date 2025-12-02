import type { DbClient } from "@Faworra/database/client";
import { serializeThreadRow, type SerializedThreadItem } from "@Faworra/database/serializers/communications";
import { getLatestMessagesForThreads, getUnreadCountsForThreads, listThreadTags } from "@Faworra/database/queries";
export async function buildConversationSnapshot(db: DbClient, teamId: string, threadId: string): Promise<SerializedThreadItem | null> {
  const {
    communicationThreads,
    communicationAccounts,
    clients,
    whatsappContacts,
    instagramContacts,
    leads,
    and,
    eq,
  } = await import("@Faworra/database/schema");

  const rows = await db
    .select({
      thread: communicationThreads,
      account: communicationAccounts,
      client: clients,
      whatsappContact: whatsappContacts,
      instagramContact: instagramContacts,
      lead: leads,
    })
    .from(communicationThreads)
    .leftJoin(communicationAccounts, eq(communicationThreads.accountId, communicationAccounts.id))
    .leftJoin(clients, eq(communicationThreads.customerId, clients.id))
    .leftJoin(whatsappContacts, eq(communicationThreads.whatsappContactId, whatsappContacts.id))
    .leftJoin(instagramContacts, eq(communicationThreads.instagramContactId, instagramContacts.id))
    .leftJoin(leads, and(eq(leads.teamId, communicationThreads.teamId), eq(leads.threadId, communicationThreads.id)))
    .where(and(eq(communicationThreads.teamId, teamId), eq(communicationThreads.id, threadId)))
    .limit(1);

  const row = rows[0] as any;
  if (!row) return null;

  const latestMap = await getLatestMessagesForThreads(db as any, teamId, [threadId]);
  const unreadMap = await getUnreadCountsForThreads(db as any, teamId, [threadId]);
  const tagsList = await listThreadTags(db as any, teamId, threadId);
  const snapshot = serializeThreadRow(row, {
    latestMessage: latestMap.get(threadId),
    unreadCount: unreadMap.get(threadId) ?? 0,
    tags: tagsList.map((t: any) => ({ id: t.id, name: t.name, color: t.color })),
  });
  return snapshot;
}
