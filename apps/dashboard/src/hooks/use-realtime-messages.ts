import { createBrowserClient } from "@Faworra/supabase/client";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRealtime } from "@/components/realtime/RealtimeProvider";

interface MessageSignatureMeta {
  id?: string;
  label?: string;
  text?: string;
}

interface MessageMeta {
  cc?: string[];
  bcc?: string[];
  quotedHtml?: string;
  quotedText?: string;
  subject?: string;
  signature?: MessageSignatureMeta;
  privateNote?: boolean;
  // Group/Sender enrichment
  senderName?: string;
  senderWaId?: string;
  isGroup?: boolean;
}

interface Message {
  id: string;
  threadId: string;
  direction: "in" | "out";
  type: "text" | "image" | "video" | "audio" | "document" | "sticker";
  content: string;
  createdAt: Date;
  deliveredAt: Date | null;
  readAt: Date | null;
  status: string;
  meta: MessageMeta | null;
}

function normalizeEmailList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const emails = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  if (!emails.length) return undefined;
  return Array.from(new Set(emails));
}

function normalizeSignature(value: unknown): MessageSignatureMeta | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  const signature: MessageSignatureMeta = {};
  if (typeof obj.id === "string" && obj.id) signature.id = obj.id;
  if (typeof obj.label === "string" && obj.label) signature.label = obj.label;
  if (typeof obj.text === "string" && obj.text) signature.text = obj.text;
  return Object.keys(signature).length ? signature : undefined;
}

function normalizeMeta(raw: unknown): MessageMeta | null {
  if (!raw) return null;
  let value = raw as unknown;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const meta: MessageMeta = {};
  const cc = normalizeEmailList(obj.cc);
  if (cc) meta.cc = cc;
  const bcc = normalizeEmailList(obj.bcc);
  if (bcc) meta.bcc = bcc;
  if (typeof obj.quotedHtml === "string" && obj.quotedHtml.trim()) {
    meta.quotedHtml = obj.quotedHtml;
  }
  if (typeof obj.quotedText === "string" && obj.quotedText.trim()) {
    meta.quotedText = obj.quotedText;
  }
  if (typeof obj.subject === "string") {
    const trimmed = obj.subject.trim();
    if (trimmed) meta.subject = trimmed;
  }
  if (typeof (obj as any).senderName === "string" && (obj as any).senderName.trim()) {
    meta.senderName = ((obj as any).senderName as string).trim();
  }
  if (typeof (obj as any).senderWaId === "string" && (obj as any).senderWaId.trim()) {
    meta.senderWaId = ((obj as any).senderWaId as string).trim();
  }
  if (typeof (obj as any).isGroup === "boolean") {
    meta.isGroup = Boolean((obj as any).isGroup);
  }
  const signature = normalizeSignature(obj.signature);
  if (signature) meta.signature = signature;
  if (typeof obj.privateNote === "boolean") {
    meta.privateNote = obj.privateNote;
  }
  return Object.keys(meta).length ? meta : null;
}

export function useRealtimeMessages(threadId: string | null) {
  const { socket, joinThread, leaveThread } = useRealtime();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  // Fetch initial messages via tRPC
  const { data: initialMessages } = trpc.communications.messages.list.useQuery(
    { threadId: threadId || "" },
    { enabled: !!threadId },
  );

  useEffect(() => {
    if (initialMessages) {
      setMessages(
        initialMessages.map((m: any) => ({
          ...m,
          content: typeof m.content === "string" ? m.content : "",
          createdAt: new Date(m.createdAt),
          deliveredAt: m.deliveredAt ? new Date(m.deliveredAt) : null,
          readAt: m.readAt ? new Date(m.readAt) : null,
          meta: normalizeMeta(m.meta),
        })),
      );
      setIsLoading(false);
    }
  }, [initialMessages]);

  // Subscribe to real-time updates via Socket.IO (preferred) with Supabase fallback
  useEffect(() => {
    if (!threadId) return;
    const supabase = createBrowserClient();

    // Socket.IO path
    let offFns: Array<() => void> = [];
    if (socket) {
      try {
        joinThread(threadId);
        const onCreated = (m: any) => {
          const newMessage: Message = {
            id: m.id,
            threadId: m.threadId || threadId,
            direction: m.direction,
            type: m.type,
            content: typeof m.content === "string" ? m.content : "",
            createdAt: new Date(m.createdAt || Date.now()),
            deliveredAt: m.deliveredAt ? new Date(m.deliveredAt) : null,
            readAt: m.readAt ? new Date(m.readAt) : null,
            status: m.status || "queued",
            meta: normalizeMeta(m.meta),
          };
          setMessages((prev) => (prev.some((x) => x.id === newMessage.id) ? prev : [...prev, newMessage]));
        };
        const onUpdated = (m: any) => {
          setMessages((prev) =>
            prev.map((x) =>
              x.id === m.id
                ? {
                    ...x,
                    type: m.type || x.type,
                    content: typeof m.content === "string" ? m.content : x.content,
                    deliveredAt: m.deliveredAt ? new Date(m.deliveredAt) : x.deliveredAt,
                    readAt: m.readAt ? new Date(m.readAt) : x.readAt,
                    status: m.status || x.status,
                    meta: normalizeMeta(m.meta ?? x.meta),
                  }
                : x,
            ),
          );
        };
        socket.on("message.created", onCreated);
        socket.on("message.updated", onUpdated);
        offFns.push(() => socket.off("message.created", onCreated));
        offFns.push(() => socket.off("message.updated", onUpdated));
      } catch {}
    }
    let eventsChannel: ReturnType<typeof supabase.channel> | null = null;
    let pgChannel: ReturnType<typeof supabase.channel> | null = null;
    if (!socket) {
      // Fallback 1) Typed broadcast channel
      eventsChannel = supabase.channel(`conversations:thread:${threadId}`);
      eventsChannel
        .on("broadcast", { event: "message.created" }, (payload: any) => {
          const m = payload.payload || payload;
          if (!m || typeof m !== "object") return;
          const newMessage: Message = {
            id: m.id,
            threadId: m.threadId || threadId,
            direction: m.direction,
            type: m.type,
            content: typeof m.content === "string" ? m.content : "",
            createdAt: new Date(m.createdAt || Date.now()),
            deliveredAt: m.deliveredAt ? new Date(m.deliveredAt) : null,
            readAt: m.readAt ? new Date(m.readAt) : null,
            status: m.status || "queued",
            meta: normalizeMeta(m.meta),
          };
          setMessages((prev) => (prev.some((x) => x.id === newMessage.id) ? prev : [...prev, newMessage]));
        })
        .on("broadcast", { event: "message.updated" }, (payload: any) => {
          const m = payload.payload || payload;
          if (!m || typeof m !== "object" || !m.id) return;
          setMessages((prev) =>
            prev.map((x) =>
              x.id === m.id
                ? {
                    ...x,
                    type: m.type || x.type,
                    content: typeof m.content === "string" ? m.content : x.content,
                    deliveredAt: m.deliveredAt ? new Date(m.deliveredAt) : x.deliveredAt,
                    readAt: m.readAt ? new Date(m.readAt) : x.readAt,
                    status: m.status || x.status,
                    meta: normalizeMeta(m.meta ?? x.meta),
                  }
                : x,
            ),
          );
        })
        .on("broadcast", { event: "message.read" }, () => {
          // For now we don't fetch; left as signal to update counts elsewhere
        })
        .subscribe();

      // Fallback 2) Postgres changes for inbound inserts/updates
      pgChannel = supabase
        .channel(`messages:thread:${threadId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "communication_messages",
            filter: `thread_id=eq.${threadId}`,
          },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              const newMessage: Message = {
                id: payload.new.id,
                threadId: payload.new.thread_id,
                direction: payload.new.direction,
                type: payload.new.type,
                content: typeof payload.new.content === "string" ? payload.new.content : "",
                createdAt: new Date(payload.new.created_at),
                deliveredAt: payload.new.delivered_at ? new Date(payload.new.delivered_at) : null,
                readAt: payload.new.read_at ? new Date(payload.new.read_at) : null,
                status: payload.new.status,
                meta: normalizeMeta(payload.new.meta),
              };
              setMessages((prev) => [...prev, newMessage]);
            } else if (payload.eventType === "UPDATE") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === payload.new.id
                    ? {
                        ...m,
                        type: payload.new.type || m.type,
                        content:
                          typeof payload.new.content === "string" ? payload.new.content : m.content,
                        deliveredAt: payload.new.delivered_at
                          ? new Date(payload.new.delivered_at)
                          : m.deliveredAt,
                        readAt: payload.new.read_at ? new Date(payload.new.read_at) : m.readAt,
                        status: payload.new.status || m.status,
                        meta: normalizeMeta(payload.new.meta ?? m.meta),
                      }
                    : m,
                ),
              );
            }
          },
        )
        .subscribe();
    }

    return () => {
      try { if (socket) leaveThread(threadId); } catch {}
      offFns.forEach((fn) => { try { fn(); } catch {} });
      try { eventsChannel?.unsubscribe(); } catch {}
      try { pgChannel?.unsubscribe(); } catch {}
    };
  }, [threadId, socket]);

  return { messages, isLoading, error };
}

export type { MessageMeta as RealtimeMessageMeta, Message as RealtimeMessage };
