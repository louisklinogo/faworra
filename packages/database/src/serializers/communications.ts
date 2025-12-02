import type {
  communicationAccounts,
  communicationThreads,
  clients,
  instagramContacts,
  leads,
  whatsappContacts,
} from "../schema";

type ThreadRow = {
  thread: typeof communicationThreads.$inferSelect;
  account: typeof communicationAccounts.$inferSelect | null;
  client: typeof clients.$inferSelect | null;
  whatsappContact: typeof whatsappContacts.$inferSelect | null;
  instagramContact: typeof instagramContacts.$inferSelect | null;
  lead: typeof leads.$inferSelect | null;
};

type LatestMessage = {
  content: string | null;
  direction: string | null;
  createdAt: Date | null;
} | undefined;

export type SerializedThreadTag = { id: string; name: string; color: string | null };

export type SerializedThreadItem = {
  id: string;
  externalContactId: string | null;
  lastMessageAt: string | null;
  lastMessage: string;
  lastDirection: string | null;
  status: string;
  snoozedUntil: string | null;
  assignedUserId: string | null;
  channel: string | null;
  account: { provider: string; status: string | null } | null;
  unreadCount: number;
  contact: { id: string; name: string | null; whatsapp: string | null; email: string | null } | null;
  whatsappContact: {
    id: string;
    waId: string | null;
    displayName: string | null;
    phone: string | null;
    metadata: Record<string, unknown> | null;
  } | null;
  instagramContact: {
    id: string;
    username: string | null;
    displayName: string | null;
    metadata: Record<string, unknown> | null;
  } | null;
  lead: {
    id: string;
    status: string | null;
    score: number | null;
    qualification: string | null;
  } | null;
  tags: SerializedThreadTag[];
  lastMessageMeta: Record<string, unknown> | null;
  lastMessageStatus: string | null;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const ensureSerializableValue = (input: unknown): any => {
  if (input === null || input === undefined) return null;
  const type = typeof input;
  if (type === "string" || type === "number" || type === "boolean") {
    return input;
  }
  if (type === "bigint") {
    try {
      return Number(input);
    } catch {
      return input.toString();
    }
  }
  if (input instanceof Date) {
    return input.toISOString();
  }
  if (Array.isArray(input)) {
    return input.map((item) => ensureSerializableValue(item));
  }
  if (input instanceof Set) {
    return Array.from(input).map((item) => ensureSerializableValue(item));
  }
  if (input instanceof Map) {
    const entries = Array.from(input.entries());
    const result: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      result[String(key)] = ensureSerializableValue(value);
    }
    return result;
  }
  if (ArrayBuffer.isView(input)) {
    const view = input as ArrayBufferView;
    return Array.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  }
  if (input instanceof ArrayBuffer) {
    return Array.from(new Uint8Array(input));
  }
  if (isPlainObject(input)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      const next = ensureSerializableValue(value);
      if (next !== undefined) {
        result[key] = next;
      }
    }
    return result;
  }
  try {
    return JSON.parse(JSON.stringify(input));
  } catch {
    return String(input);
  }
};

type SerializeOptions = {
  latestMessage?: LatestMessage;
  unreadCount?: number;
  tags?: SerializedThreadTag[];
};

export const serializeThreadRow = (
  row: ThreadRow,
  options?: SerializeOptions,
): SerializedThreadItem => {
  const { thread, account, client, whatsappContact, instagramContact, lead } = row;
  const latest = options?.latestMessage;
  const unread = Number(options?.unreadCount ?? 0) || 0;
  const tags = options?.tags ?? [];

  const lastMessageContent =
    typeof latest?.content === "string"
      ? latest.content
      : latest?.content != null
        ? String(latest.content)
        : "";

  const rawLatestMeta =
    latest && typeof latest === "object" && "meta" in (latest as any)
      ? (latest as any).meta
      : null;
  const rawLatestStatus =
    latest && typeof latest === "object" && "status" in (latest as any)
      ? (latest as any).status
      : null;

  const snoozedUntilValue =
    thread.snoozedUntil != null
      ? new Date(thread.snoozedUntil).toISOString()
      : null;

  return {
    id: thread.id,
    externalContactId: thread.externalContactId ?? null,
    lastMessageAt: thread.lastMessageAt ? new Date(thread.lastMessageAt).toISOString() : null,
    lastMessage: lastMessageContent,
    lastDirection: latest?.direction ?? null,
    status: thread.status,
    snoozedUntil: snoozedUntilValue,
    assignedUserId: thread.assignedUserId ?? null,
    channel: thread.channel ?? null,
    account: account
      ? {
          provider: account.provider ?? "",
          status: account.status ?? null,
        }
      : null,
    unreadCount: unread < 0 ? 0 : unread,
    contact: client
      ? {
          id: client.id,
          name: client.name ?? null,
          whatsapp: client.whatsapp ?? null,
          email: (client.email as string | null | undefined) ?? null,
        }
      : null,
    whatsappContact: whatsappContact
      ? {
          id: whatsappContact.id,
          waId: whatsappContact.waId ?? null,
          displayName: whatsappContact.displayName ?? null,
          phone: whatsappContact.phone ?? null,
          metadata: ensureSerializableValue(whatsappContact.metadata) ?? null,
        }
      : null,
    instagramContact: instagramContact
      ? {
          id: instagramContact.id,
          username: instagramContact.username ?? null,
          displayName: instagramContact.displayName ?? null,
          metadata: ensureSerializableValue(instagramContact.metadata) ?? null,
        }
      : null,
    lead: lead
      ? {
          id: lead.id,
          status: lead.status ?? null,
          score:
            lead.score === null || lead.score === undefined
              ? null
              : Number.isFinite(Number(lead.score))
                ? Number(lead.score)
                : null,
          qualification: lead.qualification ?? null,
        }
      : null,
    tags,
    lastMessageMeta: ensureSerializableValue(rawLatestMeta) ?? null,
    lastMessageStatus:
      typeof rawLatestStatus === "string" && rawLatestStatus.trim()
        ? rawLatestStatus
        : null,
  };
};

export const serializeThreads = (
  rows: ThreadRow[],
  options?: {
    latestMessages?: Map<string, LatestMessage>;
    unreadCounts?: Map<string, number>;
    tagsByThread?: Map<string, SerializedThreadTag[]>;
  },
): SerializedThreadItem[] => {
  const latest = options?.latestMessages ?? new Map();
  const unread = options?.unreadCounts ?? new Map();
  const tags = options?.tagsByThread ?? new Map();

  return rows.map((row) =>
    serializeThreadRow(row, {
      latestMessage: latest.get(row.thread.id),
      unreadCount: unread.get(row.thread.id) ?? 0,
      tags: tags.get(row.thread.id) ?? [],
    }),
  );
};
