import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@Faworra/supabase/types";

export type OutboxJob = {
  id: string;
  account_id: string;
  recipient: string;
  content: string | null;
  team_id: string;
  client_message_id: string | null;
  media_path: string | null;
  media_type: string | null;
  media_filename: string | null;
  caption: string | null;
  meta: Json | null;
  provider_message_id: string | null;
};

export async function ensureThread(
  supabase: SupabaseClient,
  accountId: string,
  externalContactIdOrJid: string,
  teamId: string,
  channel: "whatsapp" | "instagram" | "email",
): Promise<string> {
  const baseContactId = channel === "whatsapp" ? externalContactIdOrJid.split("@")[0] : externalContactIdOrJid;
  const externalContactId = (baseContactId as string)?.trim?.() || baseContactId;
  const { data: t } = await (supabase as any)
    .from("communication_threads")
    .select("id")
    .eq("account_id", accountId)
    .eq("external_contact_id", externalContactId)
    .maybeSingle();
  if (t?.id) return t.id as string;
  const { data: created, error: createErr } = await (supabase as any)
    .from("communication_threads")
    .insert({ team_id: teamId, account_id: accountId, channel, external_contact_id: externalContactId, status: "open", last_message_at: new Date().toISOString() })
    .select("id")
    .single();
  if (createErr) throw createErr;
  return (created as any).id as string;
}

export async function recordSentMessage(
  supabase: SupabaseClient,
  job: OutboxJob,
  providerMessageId: string | null,
  msgType: string,
  threadId: string,
) {
  const sentAt = new Date().toISOString();
  const baseContent = job.media_path ? job.caption || null : job.content;
  const updatePayload: { provider_message_id: string | null; type: string; sent_at: string; status: "sent"; content: string | null; meta?: Json } = {
    provider_message_id: providerMessageId,
    type: msgType,
    sent_at: sentAt,
    status: "sent",
    content: baseContent,
  };
  if (job.meta) updatePayload.meta = job.meta as Json;

  let messageId: string | null = null;
  let targetThreadId: string = threadId;
  if (job.client_message_id) {
    const { data: existing } = await (supabase as any)
      .from("communication_messages")
      .select("id, thread_id")
      .eq("team_id", job.team_id)
      .eq("client_message_id", job.client_message_id)
      .maybeSingle();
    if (existing?.id) {
      messageId = existing.id as string;
      if (existing.thread_id) targetThreadId = existing.thread_id as string;
      await (supabase as any).from("communication_messages").update(updatePayload).eq("id", existing.id as string);
    }
  }
  if (!messageId) {
    const insertPayload: { team_id: string; thread_id: string; provider_message_id: string | null; direction: "out"; type: string; content: string | null; client_message_id: string | null; sent_at: string; status: "sent"; meta?: Json } = {
      team_id: job.team_id as string,
      thread_id: threadId,
      provider_message_id: providerMessageId,
      direction: "out",
      type: msgType,
      content: baseContent,
      client_message_id: (job.client_message_id as string | null) || null,
      sent_at: sentAt,
      status: "sent",
    };
    if (job.meta) insertPayload.meta = job.meta as Json;
    const { data: created, error: msgErr } = await (supabase as any)
      .from("communication_messages")
      .insert(insertPayload)
      .select("id, thread_id")
      .single();
    if (msgErr) return { messageId: null as string | null, threadId: targetThreadId };
    messageId = (created as any)?.id as string;
    if ((created as any)?.thread_id) targetThreadId = (created as any).thread_id as string;
  }
  if (messageId) {
    await (supabase as any).from("communication_threads").update({ last_message_at: sentAt }).eq("id", targetThreadId);
    if (job.media_path && job.media_type) {
      await (supabase as any).from("message_attachments").insert({ message_id: messageId, storage_path: job.media_path, content_type: job.media_type });
    }
  }
  return { messageId, threadId: targetThreadId };
}

export function buildEmailBodies(content: string | null, meta: Record<string, unknown>): { html: string; text: string } {
  const textContent = (content ?? "").trim();
  const htmlSegments: string[] = [];
  const textSegments: string[] = [];
  if (textContent) {
    htmlSegments.push(`<div>${escapeHtml(textContent).replace(/\n/g, "<br />")}</div>`);
    textSegments.push(textContent);
  }
  const quotedHtmlRaw = typeof meta["quotedHtml"] === "string" ? (meta["quotedHtml"] as string).trim() : "";
  const quotedTextRaw = typeof meta["quotedText"] === "string" ? (meta["quotedText"] as string).trim() : "";
  if (quotedHtmlRaw) {
    htmlSegments.push(`<blockquote style="margin:16px 0;padding-left:12px;border-left:2px solid #d1d5db;">${quotedHtmlRaw}</blockquote>`);
    const plain = htmlToPlainText(quotedHtmlRaw);
    if (plain) textSegments.push(prefixQuoteLines(plain));
  } else if (quotedTextRaw) {
    htmlSegments.push(`<blockquote style="margin:16px 0;padding-left:12px;border-left:2px solid #d1d5db;">${escapeHtml(quotedTextRaw).replace(/\n/g, "<br />")}</blockquote>`);
    textSegments.push(prefixQuoteLines(quotedTextRaw));
  }
  const html = htmlSegments.length ? htmlSegments.join("<br />") : "<div></div>";
  const text = textSegments.length ? textSegments.join("\n\n") : "";
  return { html, text };
}

export function prefixQuoteLines(input: string): string {
  return input
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trimEnd();
      return trimmed.startsWith(">") ? trimmed : `> ${trimmed}`;
    })
    .join("\n");
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>(\r?\n)?/gi, "\n")
    .replace(/<\/?p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return char;
    }
  });
}

export function normalizeIgType(t: string) {
  if (["image", "video", "audio", "file", "document"].includes(t)) return t === "document" ? "file" : t;
  return "file";
}

export function formatJid(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@s.whatsapp.net`;
}
