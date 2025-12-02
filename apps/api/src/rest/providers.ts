import { StartBaileysSessionSchema } from "@Faworra/schemas";
import { upsertCommunicationAccount } from "@Faworra/supabase/mutations";
import type { Hono } from "hono";
import type { ApiEnv } from "../types/hono-env";
import crypto from "node:crypto";

// Simple in-memory rate limiter (per-process). For production behind a single instance.
const rlStore = new Map<string, { count: number; ts: number }>();
function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const rec = rlStore.get(key);
  if (!rec || now - rec.ts > windowMs) {
    rlStore.set(key, { count: 1, ts: now });
    return { allowed: true };
  }
  if (rec.count >= limit) {
    return { allowed: false };
  }
  rec.count += 1;
  return { allowed: true };
}

const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const RL_WINDOW_MS = 60_000; // 1 minute
const RL_START_LIMIT = 10; // 10 req / minute / IP
const RL_QR_LIMIT = 30; // 30 req / minute / externalId+IP

export function registerProviderRoutes(app: Hono<ApiEnv>) {
  // ---------------------- Instagram Direct (Meta) OAuth ----------------------
  const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || "";
  const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "";
  const IG_API_VERSION = process.env.INSTAGRAM_API_VERSION || "v22.0";

  function baseApiUrl(c: any) {
    // Prefer explicit public URL, else infer from request
    const envUrl = process.env.API_PUBLIC_URL || process.env.API_URL;
    if (envUrl) return envUrl.replace(/\/$/, "");
    const host = c.req.header("x-forwarded-host") || c.req.header("host") || "localhost:3001";
    const proto = c.req.header("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
    }

  function signState(payload: object) {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto.createHmac("sha256", INSTAGRAM_APP_SECRET).update(data).digest("base64url");
    return `${data}.${sig}`;
  }

  function verifyState(state: string): { ok: boolean; payload?: any } {
    if (!state || !state.includes(".")) return { ok: false };
    const [data, sig] = state.split(".");
    const expected = crypto.createHmac("sha256", INSTAGRAM_APP_SECRET).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return { ok: false };
    try {
      const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
      return { ok: true, payload };
    } catch {
      return { ok: false };
    }
  }

  app.post("/providers/instagram/oauth/start", async (c) => {
    if (process.env.INSTAGRAM_ENABLED !== "true") {
      return c.json({ error: "instagram integration disabled" }, HTTP.BAD_REQUEST);
    }
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      return c.json({ error: "Instagram app not configured" }, HTTP.INTERNAL_SERVER_ERROR);
    }
    const teamId = c.get("teamId");
    const state = signState({ teamId, iat: Math.floor(Date.now() / 1000) });
    const redirectUri = `${baseApiUrl(c)}/oauth/instagram/callback`;
    const url = new URL("https://api.instagram.com/oauth/authorize");
    url.searchParams.set("client_id", INSTAGRAM_APP_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set(
      "scope",
      ["instagram_business_basic", "instagram_business_manage_messages"].join(","),
    );
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    return c.json({ url: url.toString() });
  });

  app.get("/oauth/instagram/callback", async (c) => {
    if (process.env.INSTAGRAM_ENABLED !== "true") {
      return c.json({ error: "instagram integration disabled" }, HTTP.BAD_REQUEST);
    }
    const code = c.req.query("code");
    const state = c.req.query("state") || "";
    const v = verifyState(state);
    if (!v.ok || !v.payload?.teamId) return c.json({ error: "invalid_state" }, HTTP.BAD_REQUEST);
    const teamId = v.payload.teamId as string;
    const admin = c.get("supabaseAdmin");
    const redirectUri = `${baseApiUrl(c)}/oauth/instagram/callback`;

    try {
      if (!code) return c.json({ error: "missing_code" }, HTTP.BAD_REQUEST);
      // Exchange short-lived token
      const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: INSTAGRAM_APP_ID,
          client_secret: INSTAGRAM_APP_SECRET,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      });
      if (!tokenRes.ok) {
        const t = await tokenRes.text();
        return c.json({ error: `token_exchange_failed: ${t}` }, HTTP.BAD_REQUEST);
      }
      const shortLived = (await tokenRes.json()) as { access_token: string; user_id: string };

      // Exchange for long-lived token
      const longUrl = new URL("https://graph.instagram.com/access_token");
      longUrl.searchParams.set("grant_type", "ig_exchange_token");
      longUrl.searchParams.set("client_secret", INSTAGRAM_APP_SECRET);
      longUrl.searchParams.set("access_token", shortLived.access_token);
      longUrl.searchParams.set("client_id", INSTAGRAM_APP_ID);
      const longRes = await fetch(longUrl);
      if (!longRes.ok) {
        const t = await longRes.text();
        return c.json({ error: `long_token_exchange_failed: ${t}` }, HTTP.BAD_REQUEST);
      }
      const longData = (await longRes.json()) as { access_token: string; token_type?: string; expires_in: number };

      // Fetch user profile
      const meUrl = new URL(`https://graph.instagram.com/${IG_API_VERSION}/me`);
      meUrl.searchParams.set("fields", "id,username,name,profile_picture_url,account_type");
      meUrl.searchParams.set("access_token", longData.access_token);
      const meRes = await fetch(meUrl);
      if (!meRes.ok) {
        const t = await meRes.text();
        return c.json({ error: `me_fetch_failed: ${t}` }, HTTP.BAD_REQUEST);
      }
      const me = (await meRes.json()) as {
        id: string;
        username: string;
        name?: string;
        profile_picture_url?: string;
        account_type?: string;
      };

      // Upsert communication account
      const creds = {
        access_token: longData.access_token,
        expires_at: new Date(Date.now() + longData.expires_in * 1000).toISOString(),
        instagram_id: me.id,
        username: me.username,
        scopes: ["instagram_business_basic", "instagram_business_manage_messages"],
      };
      const { data: account, error: upErr } = await upsertCommunicationAccount(admin, {
        provider: "instagram_meta",
        external_id: me.id,
        display_name: me.username,
        status: "connected",
        credentials_encrypted: JSON.stringify(creds),
        team_id: teamId,
      } as any);
      if (upErr) return c.json({ error: upErr.message }, HTTP.INTERNAL_SERVER_ERROR);

      // Best-effort subscribe to messages
      try {
        const subUrl = new URL(`https://graph.instagram.com/${IG_API_VERSION}/${me.id}/subscribed_apps`);
        subUrl.searchParams.set("access_token", longData.access_token);
        subUrl.searchParams.set("subscribed_fields", "messages,message_reactions,messaging_seen");
        await fetch(subUrl, { method: "POST" });
      } catch (_e) {
        // ignore
      }

      const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirect = new URL(frontend);
      redirect.pathname = "/inbox";
      redirect.searchParams.set("connected", "instagram");
      return c.redirect(redirect.toString(), 302);
    } catch (e: any) {
      return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
    }
  });

  // Start a Baileys session (placeholder until worker integration is ready)
  app.post("/providers/whatsapp/baileys/session/start", async (c) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("cf-connecting-ip") ||
      "unknown";
    const rlKey = `start:${ip}`;
    const rl = rateLimit(rlKey, RL_START_LIMIT, RL_WINDOW_MS);
    if (!rl.allowed) {
      return c.json({ error: "Too many requests" }, HTTP.TOO_MANY_REQUESTS);
    }

    const body = await c.req.json().catch(() => ({}));
    const parsed = StartBaileysSessionSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.message }, HTTP.BAD_REQUEST);
    }

    const admin = c.get("supabaseAdmin");
    const teamId = c.get("teamId") as string | undefined;
    if (!teamId) return c.json({ error: "teamId missing" }, HTTP.BAD_REQUEST);
    const team = teamId as string;
    const { externalId, displayName } = parsed.data;

    // Ensure a default team exists (until auth context provides teamId)
    // Upsert communication account
    const { data, error } = await upsertCommunicationAccount(admin, {
      provider: "whatsapp_baileys",
      external_id: externalId,
      display_name: displayName,
      status: "connecting",
      team_id: teamId!,
    });

    if (error) {
      return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    }

    // Return placeholder QR info (worker will update via events later)
    return c.json({ account: data, qr: "pending" });
  });

  app.get("/providers/whatsapp/baileys/session/qr", async (c) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("cf-connecting-ip") ||
      "unknown";
    const ext = c.req.query("externalId") || "none";
    const rlKey = `qr:${ext}:${ip}`;
    const rl = rateLimit(rlKey, RL_QR_LIMIT, RL_WINDOW_MS);
    if (!rl.allowed) {
      return c.json({ error: "Too many requests" }, HTTP.TOO_MANY_REQUESTS);
    }

    const externalId = c.req.query("externalId");
    if (!externalId) {
      return c.json({ error: "externalId is required" }, HTTP.BAD_REQUEST);
    }
    const admin = c.get("supabaseAdmin");
    const teamId = c.get("teamId") as string | undefined;
    if (!teamId) return c.json({ error: "teamId missing" }, HTTP.BAD_REQUEST);
    const { data, error } = await admin
      .from("communication_accounts")
      .select("credentials_encrypted, status")
      .eq("provider", "whatsapp_baileys")
      .eq("team_id", teamId)
      .eq("external_id", externalId)
      .limit(1)
      .maybeSingle<{ credentials_encrypted: string | null; status: string }>();
    if (error) {
      return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    }
    let qr: string | null = null;
    if (data?.credentials_encrypted) {
      try {
        const parsed = JSON.parse(data.credentials_encrypted as unknown as string);
        qr = parsed?.qr ?? null;
      } catch (_err) {
        // ignore: credentials payload may not be valid JSON yet
      }
    }
    return c.json({ status: data?.status ?? "unknown", qr });
  });

  // Server-Sent Events stream for QR/status updates
  app.get("/providers/whatsapp/baileys/session/qr/stream", async (c) => {
    const externalId = c.req.query("externalId");
    if (!externalId) {
      return c.json({ error: "externalId is required" }, HTTP.BAD_REQUEST);
    }
    const admin = c.get("supabaseAdmin");
    const teamId = c.get("teamId") as string | undefined;
    if (!teamId) return c.json({ error: "teamId missing" }, HTTP.BAD_REQUEST);
    const team = teamId as string;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const enc = new TextEncoder();
        let lastPayload = "";
        let closed = false;

        async function fetchState() {
          const { data, error } = await admin
            .from("communication_accounts")
            .select("credentials_encrypted, status")
            .eq("provider", "whatsapp_baileys")
            .eq("team_id", team)
            .eq("external_id", externalId as string)
            .limit(1)
            .maybeSingle<{ credentials_encrypted: string | null; status: string }>();
          if (error) return;
          let qr: string | null = null;
          if (data?.credentials_encrypted) {
            try {
              const parsed = JSON.parse(data.credentials_encrypted as unknown as string);
              qr = parsed?.qr ?? null;
            } catch {}
          }
          const payload = JSON.stringify({ status: data?.status ?? "unknown", qr });
          if (payload !== lastPayload) {
            lastPayload = payload;
            controller.enqueue(enc.encode(`event: update\n`));
            controller.enqueue(enc.encode(`data: ${payload}\n\n`));
          }
        }

        const poll = setInterval(fetchState, 2000);
        const ping = setInterval(() => controller.enqueue(enc.encode(`: ping\n\n`)), 15000);
        await fetchState();

        const signal = (c.req as any).raw?.signal || (c.req as any).signal;
        if (signal && typeof signal.addEventListener === "function") {
          signal.addEventListener("abort", () => {
            if (closed) return;
            clearInterval(poll);
            clearInterval(ping);
            closed = true;
            try {
              controller.close();
            } catch {}
          });
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  });

  // Instagram disconnect (clear creds and mark disconnected)
  app.post("/providers/instagram/disconnect", async (c) => {
    const admin = c.get("supabaseAdmin");
    const teamId = c.get("teamId") as string | undefined;
    if (!teamId) return c.json({ error: "teamId missing" }, HTTP.BAD_REQUEST);
    const { externalId } = (await c.req.json().catch(() => ({}))) as { externalId?: string };
    if (!externalId) return c.json({ error: "externalId is required" }, HTTP.BAD_REQUEST);
    const { error } = await admin
      .from("communication_accounts")
      .update({ status: "disconnected", credentials_encrypted: null, updated_at: new Date().toISOString() })
      .eq("team_id", teamId)
      .eq("provider", "instagram_meta")
      .eq("external_id", externalId);
    if (error) return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    return c.json({ success: true });
  });

  // Restart a Baileys session (stub - worker should pick it up)
  app.post("/providers/whatsapp/baileys/session/restart", async (c) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("cf-connecting-ip") ||
      "unknown";
    const rl = rateLimit(`restart:${ip}`, RL_START_LIMIT, RL_WINDOW_MS);
    if (!rl.allowed) return c.json({ error: "Too many requests" }, HTTP.TOO_MANY_REQUESTS);

    const admin = c.get("supabaseAdmin");
    const teamId = c.get("teamId") as string | undefined;
    if (!teamId) return c.json({ error: "teamId missing" }, HTTP.BAD_REQUEST);
    const body = await c.req.json().catch(() => ({}));
    const externalId = body?.externalId as string | undefined;
    if (!externalId) return c.json({ error: "externalId is required" }, HTTP.BAD_REQUEST);

    const { error } = await admin
      .from("communication_accounts")
      .update({ status: "connecting", updated_at: new Date().toISOString() })
      .eq("team_id", teamId)
      .eq("provider", "whatsapp_baileys")
      .eq("external_id", externalId);
    if (error) return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    return c.json({ success: true });
  });

  // Disconnect a Baileys session (clear creds)
  app.post("/providers/whatsapp/baileys/session/disconnect", async (c) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("cf-connecting-ip") ||
      "unknown";
    const rl = rateLimit(`disconnect:${ip}`, RL_START_LIMIT, RL_WINDOW_MS);
    if (!rl.allowed) return c.json({ error: "Too many requests" }, HTTP.TOO_MANY_REQUESTS);

    const admin = c.get("supabaseAdmin");
    const teamId = c.get("teamId") as string | undefined;
    if (!teamId) return c.json({ error: "teamId missing" }, HTTP.BAD_REQUEST);
    const body = await c.req.json().catch(() => ({}));
    const externalId = body?.externalId as string | undefined;
    if (!externalId) return c.json({ error: "externalId is required" }, HTTP.BAD_REQUEST);

    const { error } = await admin
      .from("communication_accounts")
      .update({ status: "disconnected", credentials_encrypted: null, updated_at: new Date().toISOString() })
      .eq("team_id", teamId)
      .eq("provider", "whatsapp_baileys")
      .eq("external_id", externalId);
    if (error) return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    return c.json({ success: true });
  });

  // List accounts for current team
  app.get("/providers/accounts", async (c) => {
    const admin = c.get("supabaseAdmin");
    const teamId = c.get("teamId") as string | undefined;
    if (!teamId) return c.json({ error: "teamId missing" }, HTTP.BAD_REQUEST);
    const provider = c.req.query("provider");
    let q = admin
      .from("communication_accounts")
      .select("id, provider, external_id, display_name, status, created_at, updated_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });
    if (provider) q = q.eq("provider", provider);
    const { data, error } = await q;
    if (error) return c.json({ error: error.message }, HTTP.INTERNAL_SERVER_ERROR);
    return c.json({ items: data });
  });
}
