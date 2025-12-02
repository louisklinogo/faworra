import { createServerClient } from "@Faworra/supabase/server";
import logger from "../logger";

export function startInstagramRefreshPoller() {
  setInterval(() => {
    refreshInstagramTokens().catch((e) => logger.error({ err: e }, "worker ig refresh error"));
  }, 6 * 60 * 60 * 1000);
}

export async function refreshInstagramTokens() {
  const supabase = await createServerClient({ admin: true });
  const { data, error } = await supabase
    .from("communication_accounts")
    .select("id, team_id, provider, credentials_encrypted, updated_at")
    .eq("provider", "instagram_meta")
    .eq("status", "connected");
  if (error) throw error;
  const now = Date.now();
  for (const acc of data ?? []) {
    if (!acc.credentials_encrypted) continue;
    try {
      const creds = JSON.parse(acc.credentials_encrypted as unknown as string) as { access_token: string; expires_at: string };
      const expiresAt = new Date(creds.expires_at).getTime();
      const updatedAt = acc.updated_at ? new Date(acc.updated_at as unknown as string).getTime() : 0;
      const isValid = now < expiresAt;
      const ageOk = now - updatedAt >= 24 * 60 * 60 * 1000;
      const nearExpiry = expiresAt < now + 10 * 24 * 60 * 60 * 1000;
      if (!isValid || !ageOk || !nearExpiry) continue;
      const url = new URL("https://graph.instagram.com/refresh_access_token");
      url.searchParams.set("grant_type", "ig_refresh_token");
      url.searchParams.set("access_token", creds.access_token);
      const r = await fetch(url);
      const body = await r.json().catch(() => ({}));
      if (!r.ok || (body as any)?.error) {
        logger.warn({ accountId: acc.id, response: body }, "ig token refresh failed");
        continue;
      }
      const newToken: string = (body as any)?.access_token;
      const expiresIn: number = (body as any)?.expires_in;
      const newCreds = { ...creds, access_token: newToken, expires_at: new Date(Date.now() + (expiresIn || 0) * 1000).toISOString() };
      await supabase
        .from("communication_accounts")
        .update({ credentials_encrypted: JSON.stringify(newCreds), updated_at: new Date().toISOString() })
        .eq("id", acc.id);
    } catch (e) {
      logger.warn({ accountId: acc.id, err: e }, "ig token refresh error");
    }
  }
}
