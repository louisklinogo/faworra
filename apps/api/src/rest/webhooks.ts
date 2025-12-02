import type { Hono } from "hono";
import type { ApiEnv } from "../types/hono-env";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";

export function mapContentType(t: string) {
  switch (t) {
    case "image":
      return "image/jpeg";
    case "video":
      return "video/mp4";
    case "audio":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
}

export function mimeToExt(m: string) {
  if (m.startsWith("image/")) return m.split("/")[1];
  if (m === "video/mp4") return "mp4";
  if (m === "audio/mpeg") return "mp3";
  if (m === "application/pdf") return "pdf";
  return "bin";
}

export function guessExtFromUrl(u: string) {
  try {
    const p = new URL(u).pathname;
    const m = p.match(/\.([a-zA-Z0-9]{2,5})(?:$|\?)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function normalizeIgType(t: string) {
  const lc = t.toLowerCase();
  if (["image", "video", "audio", "file", "document"].includes(lc)) {
    return lc === "document" ? "file" : lc;
  }
  return "file";
}

export function registerWebhookRoutes(app: Hono<ApiEnv>) {
  const HTTP = {
    OK: 200,
    FORBIDDEN: 403,
  } as const;
  // Meta (WhatsApp Cloud & Instagram) verification
  app.get("/webhooks/meta", (c) => {
    const mode = c.req.query("hub.mode");
    const token = c.req.query("hub.verify_token");
    const challenge = c.req.query("hub.challenge");
    const okToken =
      token && [process.env.META_VERIFY_TOKEN, process.env.INSTAGRAM_VERIFY_TOKEN].includes(token);
    if (mode && token && challenge && okToken) {
      return c.text(challenge, HTTP.OK);
    }
    return c.text("Forbidden", HTTP.FORBIDDEN);
  });

  // Meta inbound events
  app.post("/webhooks/meta", async (c) => {
    const logger = c.get("logger");
    const raw = await c.req.text();
    const sig = c.req.header("x-hub-signature-256") || "";
    const secret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "";
    if (!secret) return c.json({ error: "missing_secret" }, 500);
    const expected =
      "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
    // constant-time compare
    if (
      !sig ||
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return c.json({ error: "invalid_signature" }, HTTP.FORBIDDEN);
    }

    const payload = JSON.parse(raw || "{}");
    if (payload?.object !== "instagram") {
      // ignore other Meta products for now
      return c.json({ ok: true });
    }

    // Feature flag gate
    if (process.env.INSTAGRAM_ENABLED !== "true") {
      logger?.info({ component: "webhook.instagram", skipped: true }, "instagram disabled");
      return c.json({ ok: true });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const entries: any[] = Array.isArray(payload.entry) ? payload.entry : [];

    const IG_API_VERSION = process.env.INSTAGRAM_API_VERSION || "v22.0";

    async function getAccount(instagramId: string) {
      const { data, error } = await supabase
        .from("communication_accounts")
        .select("id, team_id, provider, external_id, credentials_encrypted")
        .eq("provider", "instagram_meta")
        .eq("external_id", instagramId)
        .maybeSingle();
      if (error || !data) return null;
      return data as unknown as {
        id: string;
        team_id: string;
        external_id: string;
        credentials_encrypted: string | null;
      };
    }

    function parseMessagingFromEntry(entry: any): any[] {
      if (Array.isArray(entry?.messaging)) return entry.messaging;
      // Test events via changes[].value
      const changes = entry?.changes;
      if (Array.isArray(changes) && changes[0]?.value) return [changes[0].value];
      return [];
    }

    async function ensureInstagramContact(teamId: string, igUserId: string, token: string) {
      // Try existing contact
      const { data: existing } = await supabase
        .from("instagram_contacts")
        .select("id, username")
        .eq("team_id", teamId)
        .eq("external_id", igUserId)
        .maybeSingle();
      if (existing?.id) return existing.id as string;

      // Fetch profile
      const url = new URL(`https://graph.instagram.com/${IG_API_VERSION}/${igUserId}`);
      url.searchParams.set(
        "fields",
        "name,username,profile_pic,follower_count,is_user_follow_business,is_business_follow_user,is_verified_user",
      );
      url.searchParams.set("access_token", token);
      const r = await fetch(url);
      if (!r.ok) {
        // If 230/9010 etc, create minimal contact
        await supabase
          .from("instagram_contacts")
          .insert({ team_id: teamId, external_id: igUserId, username: igUserId, display_name: igUserId });
        const { data: created } = await supabase
          .from("instagram_contacts")
          .select("id")
          .eq("team_id", teamId)
          .eq("external_id", igUserId)
          .maybeSingle();
        return (created as any)?.id as string;
      }
      const profile = (await r.json()) as any;
      const insert = {
        team_id: teamId,
        external_id: igUserId,
        username: profile.username || igUserId,
        display_name: profile.name || profile.username || igUserId,
        profile_pic_url: profile.profile_pic || null,
        metadata: {
          follower_count: profile.follower_count,
          is_user_follow_business: profile.is_user_follow_business,
          is_business_follow_user: profile.is_business_follow_user,
          is_verified_user: profile.is_verified_user,
        },
      } as any;
      try {
        await supabase.from("instagram_contacts").insert(insert as any);
      } catch (_) {
        // ignore conflicts
      }
      const { data: created } = await supabase
        .from("instagram_contacts")
        .select("id")
        .eq("team_id", teamId)
        .eq("external_id", igUserId)
        .maybeSingle();
      return (created as any)?.id as string;
    }

    async function ensureThread(
      teamId: string,
      accountId: string,
      igUserId: string,
    ): Promise<string> {
      const { data: t } = await supabase
        .from("communication_threads")
        .select("id")
        .eq("account_id", accountId)
        .eq("external_contact_id", igUserId)
        .maybeSingle();
      if (t?.id) return (t as any).id as string;
      const { data: created, error: createErr } = await supabase
        .from("communication_threads")
        .insert({
          team_id: teamId,
          account_id: accountId,
          channel: "instagram",
          external_contact_id: igUserId,
          status: "open",
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (createErr) throw createErr;
      return (created as any).id as string;
    }

    

    // Simple rate limiter per Instagram business id
    const rlWindowMs = 60_000;
    const rlLimitPerAccount = Number(process.env.INSTAGRAM_WEBHOOK_RL_PER_MIN || 600);
    type RLRec = { ts: number; count: number };
    const bucket = (globalThis as any).__ig_rl__ || ((globalThis as any).__ig_rl__ = new Map<string, RLRec>());

    function allow(key: string) {
      const now = Date.now();
      const rec = bucket.get(key) as RLRec | undefined;
      if (!rec || now - rec.ts > rlWindowMs) {
        bucket.set(key, { ts: now, count: 1 });
        return true;
      }
      if (rec.count >= rlLimitPerAccount) return false;
      rec.count += 1;
      return true;
    }

    for (const entry of entries) {
      const messagingList = parseMessagingFromEntry(entry);
      for (const messaging of messagingList) {
        const isEcho = Boolean(messaging?.message?.is_echo);
        const instagramId = isEcho
          ? messaging?.sender?.id
          : messaging?.recipient?.id;
        if (instagramId && !allow(`ig:${instagramId}`)) {
          logger?.warn({ instagramId }, "rate limited instagram webhook entry");
          continue;
        }
        const account = instagramId ? await getAccount(String(instagramId)) : null;
        if (!account) continue;
        const creds = account.credentials_encrypted
          ? JSON.parse(account.credentials_encrypted)
          : {};
        const token: string = creds.access_token || "";

        // Read events
        if (messaging?.read?.mid) {
          const mid = String(messaging.read.mid);
          const { data: msg } = await supabase
            .from("communication_messages")
            .select("id, thread_id")
            .eq("team_id", account.team_id)
            .eq("provider_message_id", mid)
            .maybeSingle();
          if (msg?.id) {
            await supabase
              .from("communication_messages")
              .update({ read_at: new Date().toISOString(), status: "read" })
              .eq("id", (msg as any).id);
          }
          continue;
        }

        const mid = messaging?.message?.mid ? String(messaging.message.mid) : null;
        if (!mid) continue;
        // Idempotency (skip duplicates)
        const { data: exists } = await supabase
          .from("communication_messages")
          .select("id")
          .eq("team_id", account.team_id)
          .eq("provider_message_id", mid)
          .maybeSingle();
        if (exists?.id) continue;

        const contactId = isEcho
          ? String(messaging?.recipient?.id)
          : String(messaging?.sender?.id);
        if (!contactId) continue;

        // Ensure contact and thread
        const igContactId = await ensureInstagramContact(account.team_id, contactId, token);
        const threadId = await ensureThread(account.team_id, account.id, contactId);

        const text: string | null = messaging?.message?.text || null;
        const attachments: any[] = Array.isArray(messaging?.message?.attachments)
          ? messaging.message.attachments
          : [];

        // Decide base message type (first attachment if present)
        const baseType = attachments.length
          ? normalizeIgType(String(attachments[0]?.type || "file"))
          : "text";

        // Create message row
        const { data: msgRow, error: insErr } = await supabase
          .from("communication_messages")
          .insert({
            team_id: account.team_id,
            thread_id: threadId,
            provider_message_id: mid,
            direction: isEcho ? "out" : "in",
            type: baseType,
            content: text,
            status: "sent",
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (insErr) continue;
        const messageId = (msgRow as any)?.id as string;

        // Download and attach media
        for (const att of attachments) {
          try {
            const attType = normalizeIgType(String(att?.type || "file"));
            let url: string | null = att?.payload?.url || null;
            if (!url) continue;
            let res = await fetch(url);
            if (!res.ok) {
              // try with access_token appended
              const sep = url.includes("?") ? "&" : "?";
              res = await fetch(`${url}${sep}access_token=${encodeURIComponent(token)}`);
            }
            if (!res.ok) continue;
            const contentType = res.headers.get("content-type") || mapContentType(attType);
            const buf = Buffer.from(await res.arrayBuffer());
            const day = new Date().toISOString().slice(0, 10);
            const ext = mimeToExt(contentType) || guessExtFromUrl(url) || attType;
            const path = `uploads/${day}/${crypto.randomUUID()}.${ext}`;
            const { error: upErr } = await supabase.storage
              .from("vault")
              .upload(path, buf, { contentType, upsert: true });
            if (upErr) continue;
            await supabase.from("message_attachments").insert({
              message_id: messageId,
              storage_path: path,
              content_type: attType,
            });
          } catch (e) {
            logger?.warn({ err: String((e as any)?.message || e) }, "attach download failed");
          }
        }

        await supabase
          .from("communication_threads")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", threadId);
      }
    }

    logger?.info({ events: entries.length }, "instagram webhook processed");
    return c.json({ ok: true });
  });

  app.post("/webhooks/resend", async (c) => {
    const logger = c.get("logger");
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      logger?.error({ component: "webhook.resend" }, "resend webhook secret not configured");
      return c.json({ error: "resend_webhook_not_configured" }, 500);
    }

    const payload = await c.req.text();
    const headers = {
      "svix-id": c.req.header("svix-id") || "",
      "svix-timestamp": c.req.header("svix-timestamp") || "",
      "svix-signature": c.req.header("svix-signature") || "",
    };

    let event: any;
    try {
      const webhook = new Webhook(secret);
      event = webhook.verify(payload, headers);
    } catch (err: any) {
      logger?.warn({
        component: "webhook.resend",
        err: String(err?.message || err),
      }, "resend webhook signature invalid");
      return c.json({ error: "invalid_signature" }, HTTP.FORBIDDEN);
    }

    const typeRaw = typeof event?.type === "string" ? event.type : "";
    const type = typeRaw.toLowerCase();
    if (!type.startsWith("email.")) {
      return c.json({ ok: true });
    }

    const emailId =
      (event?.data && typeof event.data.email_id === "string" && event.data.email_id) ||
      (event?.data && typeof event.data.id === "string" && event.data.id) ||
      (event?.data && typeof event.data.message_id === "string" && event.data.message_id) ||
      null;
    if (!emailId) {
      logger?.warn({ component: "webhook.resend", type: typeRaw }, "missing email id");
      return c.json({ ok: true });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: message } = await supabase
      .from("communication_messages")
      .select("id, status")
      .eq("provider_message_id", emailId)
      .maybeSingle();

    const { data: outbox } = await supabase
      .from("communication_outbox")
      .select("id, status")
      .eq("provider_message_id", emailId)
      .maybeSingle();

    const updates: Record<string, unknown> = {};
    const outboxUpdates: Record<string, unknown> = {};
    let deliveryStatus = type;
    const nowIso = new Date().toISOString();
    const bounceInfo = event?.data?.bounce;
    const reasonCandidate =
      (bounceInfo && typeof bounceInfo?.error?.message === "string" && bounceInfo.error.message) ||
      (bounceInfo && typeof bounceInfo?.description === "string" && bounceInfo.description) ||
      (bounceInfo && typeof bounceInfo?.type === "string" && bounceInfo.type) ||
      (typeof event?.data?.reason === "string" && event.data.reason) ||
      typeRaw;
    const reason = (reasonCandidate ? String(reasonCandidate) : typeRaw).trim();
    const reasonValue = reason.length ? reason : typeRaw;

    if (type === "email.delivered") {
      const deliveredAt =
        (typeof event?.data?.delivered_at === "string" && event.data.delivered_at) || nowIso;
      updates.status = "delivered";
      updates.delivered_at = deliveredAt;
      updates.error = null;
      outboxUpdates.status = "sent";
      outboxUpdates.error = null;
      deliveryStatus = "delivered";
    } else if (type.includes("bounce")) {
      updates.status = "bounced";
      updates.error = reasonValue;
      outboxUpdates.status = "failed";
      outboxUpdates.error = reasonValue;
      deliveryStatus = "bounced";
    } else if (type === "email.complained" || type === "email.dropped") {
      updates.status = "failed";
      updates.error = reasonValue;
      outboxUpdates.status = "failed";
      outboxUpdates.error = reasonValue;
      deliveryStatus = type === "email.complained" ? "complained" : "dropped";
    } else {
      return c.json({ ok: true });
    }

    if (Object.keys(updates).length && message?.id) {
      await supabase.from("communication_messages").update(updates).eq("id", message.id);
    }
    if (Object.keys(outboxUpdates).length && outbox?.id) {
      await supabase.from("communication_outbox").update(outboxUpdates).eq("id", outbox.id);
    }
    if (message?.id) {
      await supabase.from("message_delivery").insert({
        message_id: message.id,
        status: deliveryStatus,
        provider_error_code: deliveryStatus === "delivered" ? null : reasonValue,
        retries: null,
      });
    }

    logger?.info({ component: "webhook.resend", type: typeRaw, emailId }, "processed resend webhook");
    return c.json({ ok: true });
  });

  // Twilio inbound messages & status callbacks
  app.post("/webhooks/twilio", async (c) => {
    // TODO: validate Twilio signature
    const _form = await c.req.parseBody();
    return c.json({ ok: true });
  });
}
