import { createServerClient } from "@Faworra/supabase/server";
import type { Json } from "@Faworra/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Buffer } from "node:buffer";
import makeWASocket, {
  DisconnectReason,
  downloadContentFromMessage,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WAMessage,
  type WASocket,
  type GroupMetadata,
  proto,
} from "@whiskeysockets/baileys";
import path from "path";
import logger from "../logger";
import type { EventBus } from "@Faworra/realtime";
import { Registry } from "./registry";
import { getRealtimeBus } from "../services/realtime-bus";

type AccountRow = { id: string; team_id: string; external_id: string; status: string };

export async function startBaileysForAccount(acc: AccountRow) {
  if (Registry.has(acc.id)) return;
  const sessionDir = path.join(process.cwd(), "apps", "worker", ".sessions", acc.id);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();
  const supabase = await createServerClient({ admin: true });

  let sock: WASocket | null = null;

  async function init() {
    sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      browser: ["Faworra", "Desktop", "1.0.0"],
    });
    Registry.set(acc.id, sock);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        await supabase
          .from("communication_accounts")
          .update({ status: "qr_pending", credentials_encrypted: JSON.stringify({ qr }) })
          .eq("id", acc.id);
      }
      if (connection === "open") {
        await supabase
          .from("communication_accounts")
          .update({ status: "connected", credentials_encrypted: null })
          .eq("id", acc.id);
      }
      if (connection === "close") {
        type BoomErr = { output?: { statusCode?: number } };
        const isLoggedOut = (
          (lastDisconnect?.error as unknown as BoomErr | undefined)?.output?.statusCode ===
          DisconnectReason.loggedOut
        );
        await supabase
          .from("communication_accounts")
          .update({ status: isLoggedOut ? "logged_out" : "reconnecting" })
          .eq("id", acc.id);
        Registry.delete(acc.id);
        if (!isLoggedOut) init();
      }
    });

    sock.ev.on("messages.upsert", async (m) => {
      if (m.type !== "notify") return;
      for (const msg of m.messages) {
        await handleMessage(acc, msg).catch((e) =>
          logger.error({ err: e }, "baileys handle message error"),
        );
      }
    });

    // Delivery & read receipts for outbound messages
    sock.ev.on("message-receipt.update", async (updates) => {
      try {
        const supabase2 = await createServerClient({ admin: true });
        for (const u of updates) {
          const keyId = u.key?.id;
          if (!keyId) continue;
          const rec = (u as unknown as { receipt?: { type?: string } }).receipt;
          const status = rec?.type as string | undefined; // 'read' | 'delivery' | 'played'
          if (!status) continue;
          const patch: { delivered_at?: string; read_at?: string; status?: "delivered" | "read" } = {};
          if (status === "delivery") patch.delivered_at = new Date().toISOString();
          if (status === "read") patch.read_at = new Date().toISOString();
          if (status === "delivery") patch.status = "delivered";
          if (status === "read") patch.status = "read";
          if (Object.keys(patch).length === 0) continue;
          await supabase2
            .from("communication_messages")
            .update(patch)
            .eq("provider_message_id", keyId)
            .eq("team_id", acc.team_id);

          // Publish realtime status update for the affected message
          try {
            const { data: m } = await supabase2
              .from("communication_messages")
              .select("id, thread_id")
              .eq("provider_message_id", keyId)
              .eq("team_id", acc.team_id)
              .maybeSingle<{ id: string; thread_id: string }>();
            if (m?.id && m.thread_id) {
              const bus = await getEventBus();
              await bus.publish({
                type: "message.updated",
                teamId: acc.team_id,
                threadId: m.thread_id,
                message: {
                  id: m.id,
                  deliveredAt: patch.delivered_at,
                  readAt: patch.read_at,
                  status: status === "read" ? "read" : status === "delivery" ? "delivered" : undefined,
                },
              });
            }
          } catch (e) {
            logger.warn({ err: e }, "failed to publish message.updated from receipt");
          }
        }
      } catch (e) {
        logger.error({ err: e }, "baileys receipt update error");
      }
    });
  }

  await init();
}

async function getEventBus(): Promise<EventBus> { return getRealtimeBus(); }

async function handleMessage(acc: { id: string; team_id: string }, msg: WAMessage) {
  const supabase = await createServerClient({ admin: true });
  const remoteJid = msg.key.remoteJid || "";
  const isGroup = remoteJid.endsWith("@g.us");
  const fromMe = !!msg.key.fromMe;
  const providerMessageId = msg.key.id || null;
  const externalContactId = (remoteJid.split("@")[0] || "").replace(/\D/g, "");
  const direction: "in" | "out" = fromMe ? "out" : "in";
  const content = extractText(msg) || null;
  const type: MessageKind = detectType(msg);
  const mediaDesc = extractMediaDescriptor(msg);

  // Drop pure status/protocol messages: no text and no media
  if (!(content || mediaDesc)) {
    return;
  }

  // Ensure thread exists
  const { data: thread, error: threadErr } = await supabase
    .from("communication_threads")
    .select("id")
    .eq("account_id", acc.id)
    .eq("external_contact_id", externalContactId)
    .maybeSingle();

  let threadId = thread?.id as string | undefined;
  if (!threadId) {
    const { data: created, error: createErr } = await supabase
      .from("communication_threads")
      .insert({
        team_id: acc.team_id,
        account_id: acc.id,
        channel: "whatsapp",
        external_contact_id: externalContactId,
        status: "open",
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (createErr) throw createErr;
    threadId = created.id as string;
  }

  // Ensure whatsapp contact exists and link to thread; enrich with group subject if applicable
  let contactId: string | null = null;
  {
    const { data: contact } = await supabase
      .from("whatsapp_contacts")
      .select("id, display_name, metadata")
      .eq("team_id", acc.team_id)
      .eq("wa_id", externalContactId)
      .maybeSingle();
    if (contact?.id) {
      contactId = contact.id as string;
    } else {
      const { data: createdContact } = await supabase
        .from("whatsapp_contacts")
        .insert({ team_id: acc.team_id, wa_id: externalContactId })
        .select("id")
        .single();
      contactId = createdContact?.id as string;
    }
    if (contactId) {
      await supabase
        .from("communication_threads")
        .update({ whatsapp_contact_id: contactId })
        .eq("id", threadId);

      // For group chats, fetch subject and persist as contact display name
      if (isGroup) {
        try {
          const sock = Registry.get(acc.id);
          const meta = (await sock?.groupMetadata?.(remoteJid)) as GroupMetadata | undefined;
          const subject: string | undefined = meta?.subject || undefined;
          const currentMeta =
            contact && typeof contact.metadata === "object" && contact.metadata
              ? (contact.metadata as Record<string, Json>)
              : {};
          const nextMeta = { ...currentMeta, isGroup: true as Json, subject: (subject as Json) ?? (currentMeta as any).subject } as Json;
          const patch: { metadata: Json; display_name?: string } = { metadata: nextMeta };
          if (subject && (!contact || !contact.display_name || contact.display_name !== subject)) {
            patch.display_name = subject;
          }
          await supabase.from("whatsapp_contacts").update(patch).eq("id", contactId);
        } catch (e) {
          logger.warn({ err: e }, "failed to fetch/update group metadata");
        }
      } else if (!fromMe) {
        // 1:1 inbound: use pushName as display name when available
        try {
          const pushName = msg.pushName as string | undefined;
          if (pushName && pushName.trim()) {
            const currentMeta =
              contact && typeof contact.metadata === "object" && contact.metadata
                ? (contact.metadata as Record<string, Json>)
                : {};
            const nextMeta = { ...currentMeta, pushName: pushName.trim(), isGroup: false } as Json;
            const patch: { metadata: Json; display_name?: string } = { metadata: nextMeta };
            if (!contact?.display_name || contact.display_name !== pushName.trim()) {
              patch.display_name = pushName.trim();
            }
            await supabase.from("whatsapp_contacts").update(patch).eq("id", contactId);
          }
        } catch (e) {
          logger.warn({ err: e }, "failed to update 1:1 contact display name");
        }
      }
    }
  }

  // Build per-message meta (sender details for group)
  let messageMeta: Json | undefined;
  if (direction === "in") {
    const participantJid = msg.key.participant as string | undefined;
    const senderWaId = (participantJid ? participantJid.split("@")[0] : undefined)?.replace(/\D/g, "");
    const senderName = msg.pushName as string | undefined;
    const metaObj: Record<string, Json> = {};
    if (senderWaId) metaObj.senderWaId = senderWaId;
    if (senderName) metaObj.senderName = senderName;
    if (isGroup) metaObj.isGroup = true;
    messageMeta = metaObj as Json;
  }
  // Insert message and return id (idempotent on provider_message_id)
  let messageId: string;
  if (providerMessageId) {
    const { data: existing } = await supabase
      .from("communication_messages")
      .select("id")
      .eq("team_id", acc.team_id)
      .eq("provider_message_id", providerMessageId)
      .maybeSingle();
    if (existing?.id) {
      messageId = existing.id as string;
    } else {
      const { data: createdMsg, error: insErr } = await supabase
        .from("communication_messages")
        .insert({
          team_id: acc.team_id,
          thread_id: threadId!,
          provider_message_id: providerMessageId,
          direction,
          type,
          content,
          meta: (messageMeta as Json) ?? null,
          sent_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      messageId = createdMsg!.id as string;
    }
  } else {
    const { data: createdMsg, error: insErr } = await supabase
      .from("communication_messages")
      .insert({
        team_id: acc.team_id,
        thread_id: threadId!,
        provider_message_id: providerMessageId,
        direction,
        type,
        content,
        meta: (messageMeta as Json) ?? null,
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (insErr) throw insErr;
    messageId = createdMsg!.id as string;
  }

  // Handle media attachments
  if (mediaDesc) {
    const { stream, mime, filename } = mediaDesc;
    const buffer = await streamToBuffer(stream);
    const storagePath = `${acc.team_id}/threads/${acc.id}/${Date.now()}_${filename || "file"}`;
    const { error: upErr } = await supabase.storage
      .from("vault")
      .upload(storagePath, buffer, { contentType: mime, upsert: true });
    if (upErr) {
      logger.error({ err: upErr, storagePath }, "media upload error");
    } else {
      await supabase.from("message_attachments").insert({
        message_id: messageId,
        storage_path: storagePath,
        content_type: mime,
        size: buffer.length,
      });
      // Index in documents (Vault)
      try {
        await supabase
          .from("documents")
          .insert({
            team_id: acc.team_id,
            name: storagePath,
            path_tokens: storagePath.split("/"),
            mime_type: mime,
            size: buffer.length,
            processing_status: "completed",
            metadata: {
              source: "inbox",
              channel: "whatsapp",
              thread_id: threadId,
              message_id: messageId,
            } as any,
          });
      } catch (e) {
        logger.warn({ err: e, storagePath }, "failed to index document in Vault");
      }
    }
  }

  // Update thread timestamp
  await supabase
    .from("communication_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);

  // Publish realtime event (inbound)
  try {
    const bus = await getEventBus();
    await bus.publish({
      type: "message.created",
      teamId: acc.team_id,
      threadId: threadId!,
      message: {
        id: messageId,
        threadId: threadId!,
        direction,
        type: type || "text",
        content: content || "",
        createdAt: new Date().toISOString(),
        meta: messageMeta || null,
        status: "received",
      },
    });
  } catch (e) {
    logger.warn({ err: e }, "failed to publish inbound message.created");
  }
}

function extractText(msg: WAMessage): string | undefined {
  const m = msg.message as proto.IMessage | undefined;
  if (!m) return;
  if (m.conversation) return m.conversation as string;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text as string;
  if (m.imageMessage?.caption) return m.imageMessage.caption as string;
  return;
}

type MessageKind = "text" | "image" | "video" | "document" | "audio" | "sticker";

function detectType(msg: WAMessage): MessageKind {
  const m = msg.message as proto.IMessage | undefined;
  if (!m) return "text";
  if (m.imageMessage) return "image";
  if (m.videoMessage) return "video";
  if (m.documentMessage) return "document";
  if (m.audioMessage) return "audio";
  if (m.stickerMessage) return "sticker";
  return "text";
}

function extractMediaDescriptor(
  msg: WAMessage,
): { stream: unknown; mime: string; filename?: string } | null {
  const m = msg.message as proto.IMessage | undefined;
  if (!m) return null;
  const mime =
    m.imageMessage?.mimetype ||
    m.videoMessage?.mimetype ||
    m.documentMessage?.mimetype ||
    m.audioMessage?.mimetype ||
    m.stickerMessage?.mimetype;
  const fileName = m.documentMessage?.fileName as string | undefined;
  const node = m.imageMessage
    ? m.imageMessage
    : m.videoMessage
      ? m.videoMessage
      : m.documentMessage
        ? m.documentMessage
        : m.audioMessage
          ? m.audioMessage
          : m.stickerMessage
            ? m.stickerMessage
            : null;
  if (!(node && mime)) return null;
  const stream = downloadContentFromMessage(
    node,
    m.imageMessage
      ? "image"
      : m.videoMessage
        ? "video"
        : m.documentMessage
          ? "document"
          : m.audioMessage
            ? "audio"
            : "sticker",
  );
  return { stream, mime, filename: fileName };
}

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  // Unwrap Promise
  if (isPromise(stream)) stream = await stream;

  // Buffer directly
  if (Buffer.isBuffer(stream)) return Buffer.from(stream);

  // AsyncIterable (e.g., Baileys async generator)
  if (isAsyncIterable(stream)) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<unknown>) {
      chunks.push(toUint8(chunk));
    }
    return Buffer.concat(chunks);
  }

  // WHATWG ReadableStream
  if (isReadableStream(stream)) {
    const reader = (stream as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value != null) chunks.push(value);
    }
    return Buffer.concat(chunks);
  }

  // Node-style Readable with .on
  if (hasOn(stream)) {
    return new Promise<Buffer>((resolve, reject) => {
      const bufs: Uint8Array[] = [];
      (stream as NodeJS.ReadableStream)
        .on("data", (chunk: unknown) => bufs.push(toUint8(chunk)))
        .on("end", () => resolve(Buffer.concat(bufs)))
        .on("error", (err: unknown) => reject(err as Error));
    });
  }

  throw new TypeError("Unsupported stream type for media download");
}

function isPromise(x: unknown): x is Promise<unknown> {
  return !!x && typeof (x as { then?: unknown }).then === "function";
}
function isAsyncIterable(x: unknown): x is AsyncIterable<unknown> {
  return !!x && typeof (x as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === "function";
}
function isReadableStream(x: unknown): x is ReadableStream<Uint8Array> {
  return !!x && typeof (x as { getReader?: unknown }).getReader === "function";
}
function hasOn(x: unknown): x is { on: (...args: unknown[]) => unknown } {
  return !!x && typeof (x as { on?: unknown }).on === "function";
}
function toUint8(chunk: unknown): Uint8Array {
  if (Buffer.isBuffer(chunk)) {
    const b = chunk as Buffer;
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  }
  if (chunk instanceof Uint8Array) return chunk;
  if (chunk instanceof ArrayBuffer) return new Uint8Array(chunk);
  // Fallback: try to coerce typed arrays
  if (
    chunk &&
    typeof (chunk as { buffer?: unknown; byteLength?: unknown }).buffer === "object" &&
    typeof (chunk as { byteLength?: unknown }).byteLength === "number"
  ) {
    try {
      const view = chunk as { buffer: ArrayBufferLike; byteOffset?: number; byteLength: number };
      return new Uint8Array(view.buffer, view.byteOffset || 0, view.byteLength);
    } catch {}
  }
  const enc = new TextEncoder();
  return enc.encode(String(chunk ?? ""));
}
