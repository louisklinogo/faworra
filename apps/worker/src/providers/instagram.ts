import type { SendProvider, SendContext, SendResult } from "./send-registry";
import { ensureThread, normalizeIgType, type OutboxJob } from "../services/outbox-helpers";

export const InstagramProvider: SendProvider = {
  name: "instagram_meta",
  async send(ctx: SendContext, job: OutboxJob): Promise<SendResult> {
    if (process.env.INSTAGRAM_ENABLED !== "true") {
      throw Object.assign(new Error("instagram disabled"), { retryable: false });
    }
    const creds = ctx.account.credentials_encrypted ? JSON.parse(ctx.account.credentials_encrypted) : {};
    const token: string = creds.access_token;
    const instagramId: string = ctx.account.external_id;
    const toId = job.recipient;
    const threadId = await ensureThread(ctx.supabase, job.account_id, toId, job.team_id, "instagram");
    const payload: any = { recipient: { id: toId } };
    let msgType = "text";
    if (job.media_path && job.media_type) {
      const { data: signed, error: sErr } = await (ctx.supabase as any).storage.from("vault").createSignedUrl(job.media_path, 60);
      if (sErr || !signed?.signedUrl) throw sErr || new Error("sign failed");
      msgType = job.media_type;
      payload.message = { attachment: { type: normalizeIgType(job.media_type), payload: { url: signed.signedUrl } } };
      if (job.caption) payload.message.caption = job.caption;
    } else {
      payload.message = { text: job.content };
    }
    if (process.env.ENABLE_INSTAGRAM_HUMAN_AGENT === "true") {
      payload.messaging_type = "MESSAGE_TAG";
      payload.tag = "HUMAN_AGENT";
    }
    const url = new URL(`https://graph.instagram.com/v22.0/${instagramId}/messages`);
    url.searchParams.set("access_token", token);
    let res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = await res.json().catch(() => ({}));
    if ((!res.ok || (body as any)?.error) && res.status >= 500) {
      await new Promise((r) => setTimeout(r, 500));
      res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    if (!res.ok || (body as any)?.error) {
      if ((body as any)?.error?.code === 190) {
        await (ctx.supabase as any).from("communication_accounts").update({ status: "reauth_required", updated_at: new Date().toISOString() }).eq("id", ctx.account.id);
        try {
          await (ctx.supabase as any).from("activities").insert({ team_id: job.team_id, type: "instagram.reauth_required", metadata: { accountId: ctx.account.id } as any });
        } catch {}
      }
      throw new Error(`ig_send_failed: ${res.status} ${JSON.stringify(body)}`);
    }
    const providerMessageId = (body as any)?.message_id || null;
    return { providerMessageId, msgType, threadId };
  },
};
