import { SendMessageSchema, SendThreadMediaSchema, SendThreadTextSchema } from "@Faworra/schemas";
import {
  createClientBasic,
  enqueueCommunicationOutbox,
  updateCommunicationThread,
} from "@Faworra/supabase/mutations";
import type { TablesUpdate } from "@Faworra/supabase/types";
import type { Hono } from "hono";
import { HTTP } from "../lib/http";
import type { ApiEnv } from "../types/hono-env";
import { createNodeEventBus } from "@Faworra/realtime";
import { createEventOutboxBus } from "../lib/event-outbox-bus";
import { db } from "@Faworra/database/client";
import { buildConversationSnapshot } from "../lib/conversation-snapshot";
import { loadApiConfig } from "@Faworra/config";

const KB = 1024;
const MB = KB * KB;
const MAX_UPLOAD_MB = 25;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * MB; // 25MB
const LIMIT_MAX = 100;
const DEFAULT_LIMIT = 50;
const SUGGESTIONS_LIMIT = 5;
const SIGNED_URL_TTL_SECONDS = 60;

const htmlEscape = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const csvEscape = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/\r?\n/g, " ");
  if (str.includes(",") || str.includes("\"")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const normalizeMetaList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const list = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return list.length ? Array.from(new Set(list)) : undefined;
};

const parseMessageMeta = (meta: unknown): Record<string, unknown> | null => {
  if (!meta) return null;
  let payload: any = meta;
  if (typeof meta === "string") {
    try {
      payload = JSON.parse(meta);
    } catch {
      return null;
    }
  }
  if (!payload || typeof payload !== "object") return null;
  const normalized: Record<string, unknown> = {};
  if (typeof payload.subject === "string" && payload.subject.trim()) {
    normalized.subject = payload.subject.trim();
  }
  const cc = normalizeMetaList(payload.cc);
  if (cc) normalized.cc = cc;
  const bcc = normalizeMetaList(payload.bcc);
  if (bcc) normalized.bcc = bcc;
  if (typeof payload.quotedHtml === "string" && payload.quotedHtml.trim()) {
    normalized.quotedHtml = payload.quotedHtml;
  }
  if (typeof payload.quotedText === "string" && payload.quotedText.trim()) {
    normalized.quotedText = payload.quotedText;
  }
  if (typeof payload.signature === "object" && payload.signature) {
    normalized.signature = payload.signature;
  }
  return Object.keys(normalized).length ? normalized : null;
};

type MessageRow = {
  id: string;
  direction: string;
  type: string;
  content: string | null;
  sent_at: string | null;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  status?: string | null;
  meta: Record<string, unknown> | null;
};

async function ensureThreadForTeam(supabase: any, id: string, teamId: string): Promise<boolean> {
  const { data: own } = await supabase
    .from("communication_threads")
    .select("id")
    .eq("id", id)
    .eq("team_id", teamId)
    .maybeSingle();
  return Boolean(own);
}

async function fetchThreadMessages(
  supabase: any,
  id: string,
  limit: number,
  before?: string | null,
): Promise<MessageRow[]> {
  let query = supabase
    .from("communication_messages")
    .select(
      "id, direction, type, content, sent_at, created_at, delivered_at, read_at, meta",
    )
    .eq("thread_id", id)
    .eq("is_status", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (before) {
    query = query.lt("created_at", before);
  }
  const { data: msgsDesc } = await query;
  return (msgsDesc ?? []).slice().reverse();
}

async function fetchAttachmentsByMessageIds(
  supabase: any,
  ids: string[],
): Promise<Map<string, any[]>> {
  const { data: atts } = await supabase
    .from("message_attachments")
    .select("id, message_id, content_type")
    .in("message_id", ids);
  const byMsg = new Map<string, any[]>();
  for (const a of atts ?? []) {
    const arr = byMsg.get(a.message_id) || [];
    arr.push({ id: a.id, content_type: a.content_type });
    byMsg.set(a.message_id, arr);
  }
  return byMsg;
}

export function registerCommunicationsRoutes(app: Hono<ApiEnv>) {
  // Upload media to storage (server-side) and return storage path
  app.post("/communications/uploads", async (c) => {
    try {
      const form = await c.req.formData();
      const val = form.get("file");
      if (!val) {
        return c.json({ error: "file is required" }, HTTP.BAD_REQUEST);
      }
      if (!(val instanceof File)) {
        return c.json({ error: "invalid file" }, HTTP.BAD_REQUEST);
      }
      const file = val as File;
      const size = file.size ?? 0;
      if (size > MAX_UPLOAD_BYTES) {
        return c.json({ error: "file too large" }, HTTP.PAYLOAD_TOO_LARGE);
      }

      const supabase = c.get("supabaseAdmin");
      const id = crypto.randomUUID();
      const safeName = file.name || id;
      const day = new Date().toISOString().slice(0, 10);
      const path = `uploads/${day}/${id}_${safeName}`;

      const { error: upErr } = await supabase.storage.from("vault").upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
      if (upErr) {
        return c.json({ error: upErr.message }, HTTP.INTERNAL_SERVER_ERROR);
      }
      return c.json({ path, contentType: file.type || null, filename: safeName });
    } catch (e: any) {
      return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
    }
  });
  app.get("/communications/accounts", async (c) => {
    const supabase = c.get("supabaseAdmin");
    const teamId = c.get("teamId");
    const { data, error } = await supabase
      .from("communication_accounts")
      .select("id, provider, external_id")
      .eq("team_id", teamId)
      .limit(LIMIT_MAX);
    if (error) {
      return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    }
    return c.json({ items: data ?? [] });
  });

  app.get("/communications/threads", async (c) => {
    const status = c.req.query("status");
    const supabase = c.get("supabaseAdmin");
    const teamId = c.get("teamId");

    let query = supabase
      .from("communication_threads")
      .select(
        "id, external_contact_id, channel, last_message_at, status, account:communication_accounts(provider), contact:clients(id, name, whatsapp, email)",
      )
      .eq("team_id", teamId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(LIMIT_MAX);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    }

    // Fallback: if status provided and empty, return latest regardless of status
    if ((data?.length ?? 0) === 0 && status) {
      const baseQ = supabase
        .from("communication_threads")
        .select(
          "id, external_contact_id, channel, last_message_at, status, account:communication_accounts(provider), contact:clients(id, name, whatsapp, email)",
        )
        .eq("team_id", teamId)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(LIMIT_MAX);
      const { data: all, error: err2 } = await baseQ;
      if (err2) {
        return c.json({ error: err2.message }, HTTP.INTERNAL_SERVER_ERROR);
      }
      return c.json({ items: all ?? [] });
    }

    return c.json({ items: data ?? [] });
  });

  // DLQ endpoints for communication_outbox (messages)
  app.get("/communications/outbox/dlq", async (c) => {
    const supabase = c.get("supabaseAdmin");
    const teamId = c.get("teamId");
    const limit = Math.min(Math.max(Number(c.req.query("limit") || 50), 1), 200);
    const { data, error } = await supabase
      .from("communication_outbox")
      .select("id, account_id, recipient, content, media_path, media_type, retry_count, last_attempt_at, error")
      .eq("team_id", teamId)
      .eq("status", "dead")
      .order("last_attempt_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    return c.json({ items: data ?? [] });
  });
  app.post("/communications/outbox/dlq/:id/retry", async (c) => {
    const supabase = c.get("supabaseAdmin");
    const teamId = c.get("teamId");
    const id = c.req.param("id");
    const { error } = await supabase
      .from("communication_outbox")
      .update({ status: "queued", next_attempt_at: new Date().toISOString(), error: null })
      .eq("id", id)
      .eq("team_id", teamId)
      .eq("status", "dead");
    if (error) return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    return c.json({ ok: true });
  });

  // DLQ endpoints for event_outbox (realtime events)
  app.get("/communications/events-outbox/dlq", async (c) => {
    const supabase = c.get("supabaseAdmin");
    const teamId = c.get("teamId");
    const limit = Math.min(Math.max(Number(c.req.query("limit") || 50), 1), 200);
    const { data, error } = await supabase
      .from("event_outbox")
      .select("id, thread_id, event_type, retry_count, last_attempt_at, error")
      .eq("team_id", teamId)
      .eq("status", "dead")
      .order("last_attempt_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    return c.json({ items: data ?? [] });
  });
  app.post("/communications/events-outbox/dlq/:id/retry", async (c) => {
    const supabase = c.get("supabaseAdmin");
    const teamId = c.get("teamId");
    const id = c.req.param("id");
    const { error } = await supabase
      .from("event_outbox")
      .update({ status: "queued", next_attempt_at: new Date().toISOString(), error: null })
      .eq("id", id)
      .eq("team_id", teamId)
      .eq("status", "dead");
    if (error) return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    return c.json({ ok: true });
  });

  app.get("/communications/threads/:id/transcript", async (c) => {
    const threadId = c.req.param("id");
    const format = (c.req.query("format") || "html").toLowerCase();
    const supabase = c.get("supabaseAdmin");
    const teamId = c.get("teamId");

    const { data: thread, error: threadErr } = await supabase
      .from("communication_threads")
      .select(
        "id, channel, status, external_contact_id, last_message_at, account:communication_accounts(display_name, provider), contact:clients(name, email, whatsapp)",
      )
      .eq("id", threadId)
      .eq("team_id", teamId)
      .maybeSingle();
    if (threadErr) {
      return c.json({ error: threadErr.message }, HTTP.INTERNAL_SERVER_ERROR);
    }
    if (!thread) {
      return c.json({ error: "Thread not found" }, HTTP.NOT_FOUND);
    }

    const messages = await fetchThreadMessages(supabase, threadId, 1000);
    const normalized = (messages || []).map((msg) => {
      const meta = parseMessageMeta(msg.meta);
      return {
        id: msg.id,
        direction: msg.direction,
        type: msg.type,
        content: msg.content || "",
        createdAt: msg.created_at,
        sentAt: msg.sent_at,
        status: msg.status ?? null,
        meta,
      };
    });

    if (format === "csv") {
      const lines: string[] = [];
      lines.push(
        [
          "Timestamp",
          "Direction",
          "Status",
          "Subject",
          "To",
          "CC",
          "BCC",
          "Body",
        ]
          .map(csvEscape)
          .join(","),
      );
      for (const msg of normalized) {
        const meta = msg.meta as Record<string, unknown> | null;
        const subject = meta && typeof meta["subject"] === "string" ? (meta["subject"] as string) : "";
        const cc = meta && Array.isArray(meta["cc"]) ? (meta["cc"] as string[]).join(";") : "";
        const bcc = meta && Array.isArray(meta["bcc"]) ? (meta["bcc"] as string[]).join(";") : "";
        const body = (msg.content || "").replace(/\r?\n/g, " ");
        lines.push(
          [
            csvEscape(msg.createdAt ? new Date(msg.createdAt as any).toISOString() : ""),
            csvEscape(msg.direction),
            csvEscape(msg.status),
            csvEscape(subject),
            csvEscape(thread.external_contact_id || ""),
            csvEscape(cc),
            csvEscape(bcc),
            csvEscape(body),
          ].join(","),
        );
      }
      const csv = lines.join("\r\n");
      return c.body(csv, 200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="thread-${threadId}.csv"`,
      });
    }

    const headerRows: string[] = [];
    headerRows.push(
      `<tr><th>Channel</th><td>${htmlEscape(thread.channel || thread.account?.provider || "")}</td></tr>`,
    );
    headerRows.push(
      `<tr><th>External ID</th><td>${htmlEscape(thread.external_contact_id || "")}</td></tr>`,
    );
    headerRows.push(
      `<tr><th>Status</th><td>${htmlEscape(thread.status || "")}</td></tr>`,
    );
    if (thread.contact) {
      headerRows.push(
        `<tr><th>Contact</th><td>${htmlEscape(
          thread.contact.name || thread.contact.email || thread.contact.whatsapp || "",
        )}</td></tr>`,
      );
    }

    const messageBlocks = normalized
      .map((msg) => {
        const meta = msg.meta as Record<string, unknown> | null;
        const timestamp = msg.createdAt ? new Date(msg.createdAt as any).toLocaleString() : "";
        const subject = meta && typeof meta["subject"] === "string" ? (meta["subject"] as string) : "";
        const cc = meta && Array.isArray(meta["cc"]) ? (meta["cc"] as string[]).join(", ") : "";
        const bcc = meta && Array.isArray(meta["bcc"]) ? (meta["bcc"] as string[]).join(", ") : "";
        const quotedHtml = meta && typeof meta["quotedHtml"] === "string" ? (meta["quotedHtml"] as string) : "";
        const quotedText = meta && typeof meta["quotedText"] === "string" ? (meta["quotedText"] as string) : "";
        const quoted = quotedHtml
          ? quotedHtml
          : quotedText
            ? `<pre>${htmlEscape(quotedText)}</pre>`
            : "";
        return `
          <article class="message ${msg.direction === "out" ? "message-out" : "message-in"}">
            <header>
              <span class="direction">${htmlEscape(msg.direction === "out" ? "Agent" : "Customer")}</span>
              <span class="timestamp">${htmlEscape(timestamp)}</span>
              ${msg.status ? `<span class="status">${htmlEscape(msg.status)}</span>` : ""}
            </header>
            ${subject ? `<div class="meta-row"><strong>Subject:</strong> ${htmlEscape(subject)}</div>` : ""}
            ${cc ? `<div class="meta-row"><strong>CC:</strong> ${htmlEscape(cc)}</div>` : ""}
            ${bcc ? `<div class="meta-row"><strong>BCC:</strong> ${htmlEscape(bcc)}</div>` : ""}
            <div class="body">${htmlEscape(msg.content).replace(/\n/g, "<br />")}</div>
            ${quoted ? `<div class="quoted"><strong>Quoted:</strong> ${quoted}</div>` : ""}
          </article>`;
      })
      .join("\n");

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Conversation Transcript</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #0f172a; background: #f8fafc; }
    h1 { font-size: 20px; margin-bottom: 16px; }
    table { border-collapse: collapse; margin-bottom: 24px; width: 100%; max-width: 640px; background: #fff; }
    th { text-align: left; padding: 8px 12px; background: #e2e8f0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .message { border-radius: 12px; margin-bottom: 16px; padding: 16px; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,0.08); }
    .message-out { border-left: 4px solid #2563eb; }
    .message-in { border-left: 4px solid #0ea5e9; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px; color: #475569; }
    header .status { margin-left: auto; margin-right: 0; font-weight: 600; }
    .meta-row { font-size: 12px; margin-bottom: 6px; color: #475569; }
    .body { font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #1f2937; }
    .quoted { margin-top: 10px; padding: 10px 12px; border-radius: 8px; background: #f1f5f9; font-size: 12px; color: #334155; }
    strong { font-weight: 600; }
  </style>
</head>
<body>
  <h1>Conversation Transcript</h1>
  <table>${headerRows.join("")}</table>
  ${messageBlocks}
</body>
</html>`;

    return c.body(html, 200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="thread-${threadId}.html"`,
    });
  });

  // Enqueue an outbound message for worker to send via provider
  app.post("/communications/messages/send", async (c) => {
    try {
      const supabase = c.get("supabaseAdmin");
      const teamId = c.get("teamId");
      const body = await c.req.json().catch(() => ({}));
      const parsed = SendMessageSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.message }, HTTP.BAD_REQUEST);
      }
      const { externalId, to, text, clientMessageId } = parsed.data;
      const { data: acc, error: accErr } = await supabase
        .from("communication_accounts")
        .select("id, team_id, provider")
        .eq("team_id", teamId)
        .eq("provider", "whatsapp_baileys")
        .eq("external_id", externalId)
        .maybeSingle();
      if (accErr || !acc) {
        return c.json({ error: "account not found" }, HTTP.NOT_FOUND);
      }
      // Idempotent enqueue by client_message_id when provided
      const { error: insErr } = await enqueueCommunicationOutbox(supabase, {
        team_id: acc.team_id,
        account_id: acc.id,
        recipient: to,
        content: text,
        status: "queued",
        client_message_id: clientMessageId || null,
      });
      if (insErr) {
        return c.json({ error: insErr.message }, HTTP.INTERNAL_SERVER_ERROR);
      }
      return c.json({ enqueued: true, clientMessageId: clientMessageId || null }, HTTP.ACCEPTED);
    } catch (e: any) {
      return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
    }
  });

  // List messages for a thread
  app.get("/communications/threads/:id/messages", async (c) => {
    try {
      const id = c.req.param("id");
      const before = c.req.query("before");
      const limitParam = c.req.query("limit");
      const limit = Math.min(Math.max(Number(limitParam) || DEFAULT_LIMIT, 1), LIMIT_MAX);
      const supabase = c.get("supabaseAdmin");
      const teamId = c.get("teamId");
      // Ensure thread belongs to team
      const owns = await ensureThreadForTeam(supabase, id, teamId);
      if (!owns) {
        return c.json({ error: "thread not found" }, HTTP.NOT_FOUND);
      }
      const msgs = await fetchThreadMessages(supabase, id, limit, before);
      const ids = (msgs ?? []).map((m) => m.id);
      if (!ids.length) {
        return c.json({ items: [] });
      }
      const byMsg = await fetchAttachmentsByMessageIds(supabase, ids);
      const items = (msgs ?? []).map((m) => ({ ...m, attachments: byMsg.get(m.id) || [] }));
      const nextCursor = items.length ? items[0]?.created_at : null; // load older using 'before'
      return c.json({ items, nextCursor });
    } catch (e: any) {
      return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
    }
  });

  // Enqueue send for a given thread
  app.post("/communications/threads/:id/send", async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json().catch(() => ({}));
      const parsed = SendThreadTextSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.message }, HTTP.BAD_REQUEST);
      }
      const { text, clientMessageId } = parsed.data;
      const supabase = c.get("supabaseAdmin");
      const teamId = c.get("teamId");
      const { data: thread, error: tErr } = await supabase
        .from("communication_threads")
        .select("id, account_id, team_id, external_contact_id")
        .eq("id", id)
        .eq("team_id", teamId)
        .maybeSingle();
      if (tErr || !thread) {
        return c.json({ error: "thread not found" }, HTTP.NOT_FOUND);
      }
      const outboxRecord: any = {
        team_id: thread.team_id,
        account_id: thread.account_id,
        recipient: thread.external_contact_id,
        content: text,
        status: "queued",
        client_message_id: clientMessageId || null,
      };
      if (parsed.data.meta) {
        outboxRecord.meta = parsed.data.meta;
      }
      const { error: insErr } = await enqueueCommunicationOutbox(supabase, outboxRecord);
      if (insErr) {
        return c.json({ error: insErr.message }, HTTP.INTERNAL_SERVER_ERROR);
      }
      // Publish conversation snapshot update so clients refresh thread state
      try {
        const cfg = loadApiConfig();
        const bus = cfg.eventOutboxEnabled ? createEventOutboxBus(db) : createNodeEventBus({ supabase, baseUrl: cfg.realtimeUrl, token: cfg.realtimeToken });
        const snapshot = await buildConversationSnapshot(db, teamId, id);
        if (snapshot) {
          await bus.publish({ type: "conversation.updated", teamId, threadId: id, conversation: snapshot });
        }
      } catch {}
      return c.json({ enqueued: true, clientMessageId: clientMessageId || null }, HTTP.ACCEPTED);
    } catch (e: any) {
      return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
    }
  });

  // Enqueue media for a given thread (storage path in 'vault')
  app.post("/communications/threads/:id/send-media", async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json().catch(() => ({}));
      const parsed = SendThreadMediaSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.message }, HTTP.BAD_REQUEST);
      }
      const { mediaPath, mediaType, caption, filename, clientMessageId } = parsed.data;
      const supabase = c.get("supabaseAdmin");
      const teamId = c.get("teamId");
      const { data: thread, error: tErr } = await supabase
        .from("communication_threads")
        .select("id, account_id, team_id, external_contact_id")
        .eq("id", id)
        .eq("team_id", teamId)
        .maybeSingle();
      if (tErr || !thread) {
        return c.json({ error: "thread not found" }, HTTP.NOT_FOUND);
      }
      const outboxRecord: any = {
        team_id: thread.team_id,
        account_id: thread.account_id,
        recipient: thread.external_contact_id,
        status: "queued",
        client_message_id: clientMessageId || null,
        media_path: mediaPath,
        media_type: mediaType,
        media_filename: filename || null,
        caption: caption || null,
        content: caption || "",
      };
      if (parsed.data.meta) {
        outboxRecord.meta = parsed.data.meta;
      }
      const { error: insErr } = await enqueueCommunicationOutbox(supabase, outboxRecord);
      if (insErr) {
        return c.json({ error: insErr.message }, HTTP.INTERNAL_SERVER_ERROR);
      }
      // Publish conversation snapshot update so clients refresh thread state
      try {
        const cfg = loadApiConfig();
        const bus = cfg.eventOutboxEnabled ? createEventOutboxBus(db) : createNodeEventBus({ supabase, baseUrl: cfg.realtimeUrl, token: cfg.realtimeToken });
        const snapshot = await buildConversationSnapshot(db, teamId, id);
        if (snapshot) {
          await bus.publish({ type: "conversation.updated", teamId, threadId: id, conversation: snapshot });
        }
      } catch {}
      return c.json({ enqueued: true }, HTTP.ACCEPTED);
    } catch (e: any) {
      return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
    }
  });

  // Typing indicator (HTTP) for non-socket clients
  app.post("/communications/threads/:id/typing", async (c) => {
    try {
      const threadId = c.req.param("id");
      const { on } = (await c.req.json().catch(() => ({}))) as { on?: boolean };
      const teamId = c.get("teamId");
      const userId = c.get("userId");
      if (!userId) return c.json({ error: "unauthorized" }, HTTP.UNAUTHORIZED);
      const supabase = c.get("supabaseAdmin");
      const bus = createNodeEventBus({ supabase });
      const type = on ? "conversation.typing_on" : "conversation.typing_off";
      await bus.publish({ type, teamId, threadId, user: { id: userId } } as any);
      return c.json({ ok: true });
    } catch (e: any) {
      return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
    }
  });

  // Contact suggestion for a thread (match by whatsapp/instagram identity -> existing clients)
  app.get("/communications/threads/:id/contact-suggestion", async (c) => {
    try {
      const id = c.req.param("id");
      const supabase = c.get("supabaseAdmin");
      const teamId = c.get("teamId");
      const { data: thread, error: tErr } = await supabase
        .from("communication_threads")
        .select("id, team_id, account_id, external_contact_id, customer_id")
        .eq("id", id)
        .eq("team_id", teamId)
        .maybeSingle();
      if (tErr || !thread) {
        return c.json({ error: "thread not found" }, HTTP.NOT_FOUND);
      }
      // Try matching by clients.whatsapp
      const phone = thread.external_contact_id;
      const { data: matches } = await supabase
        .from("clients")
        .select("id, name, whatsapp")
        .eq("team_id", thread.team_id)
        .eq("whatsapp", phone)
        .limit(SUGGESTIONS_LIMIT);
      return c.json({
        linkedClientId: thread.customer_id || null,
        externalContactId: thread.external_contact_id,
        suggestions: matches ?? [],
      });
    } catch (e: any) {
      return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
    }
  });

  // Promote/link contact to client for a thread
  app.post("/communications/threads/:id/promote", async (c) => {
    try {
      const id = c.req.param("id");
      const { clientId, name } = (await c.req.json().catch(() => ({}))) as {
        clientId?: string;
        name?: string;
      };
      const supabase = c.get("supabaseAdmin");
      const _teamId = (c.get as any)("teamId") as string;
      const { data: thread, error: tErr } = await supabase
        .from("communication_threads")
        .select("id, team_id, external_contact_id")
        .eq("id", id)
        .maybeSingle<{ id: string; team_id: string; external_contact_id: string }>();
      if (tErr || !thread) {
        return c.json({ error: "thread not found" }, HTTP.NOT_FOUND);
      }
      let finalClientId = clientId || null;
      if (!finalClientId) {
        const { data: created, error: cErr } = await createClientBasic(supabase, {
          team_id: thread.team_id,
          name: name || thread.external_contact_id,
          whatsapp: thread.external_contact_id,
        });
        if (cErr) {
          return c.json({ error: cErr.message }, HTTP.INTERNAL_SERVER_ERROR);
        }
        finalClientId = created.id as string;
      }
      const updatePayload: TablesUpdate<"communication_threads"> = {
        customer_id: finalClientId,
      };
      const { error: uErr } = await updateCommunicationThread(
        supabase,
        id,
        thread.team_id,
        updatePayload,
      );
      if (uErr) {
        return c.json({ error: uErr.message }, HTTP.INTERNAL_SERVER_ERROR);
      }
      return c.json({ linked: true, clientId: finalClientId });
    } catch (e: any) {
      return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
    }
  });

  // Signed URL for attachment
  app.get("/communications/attachments/:id/url", async (c) => {
    try {
      const id = c.req.param("id");
      const supabase = c.get("supabaseAdmin");
      const { data: a, error } = await supabase
        .from("message_attachments")
        .select("storage_path")
        .eq("id", id)
        .maybeSingle();
      if (error || !a) {
        return c.json({ error: "not found" }, HTTP.NOT_FOUND);
      }
      const { data: signed, error: sErr } = await supabase.storage
        .from("vault")
        .createSignedUrl(a.storage_path as string, SIGNED_URL_TTL_SECONDS);
      if (sErr || !signed?.signedUrl) {
        return c.json({ error: sErr?.message || "sign failed" }, HTTP.INTERNAL_SERVER_ERROR);
      }
      return c.json({ url: signed.signedUrl });
    } catch (e: any) {
      return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
    }
  });
}
