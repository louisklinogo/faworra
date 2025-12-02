import type { SendProvider, SendContext, SendResult } from "./send-registry";
import { ensureThread, buildEmailBodies, type OutboxJob } from "../services/outbox-helpers";
import { Resend } from "resend";

export const EmailProvider: SendProvider = {
  name: "email_resend",
  async send(ctx: SendContext, job: OutboxJob): Promise<SendResult> {
    const creds = ctx.account.credentials_encrypted ? JSON.parse(ctx.account.credentials_encrypted) ?? {} : {};
    const apiKey: string | undefined = creds.apiKey || process.env.RESEND_API_KEY;
    const fromEmail: string | undefined = creds.fromEmail || process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !fromEmail) throw new Error("resend credentials missing");
    const resend = new Resend(apiKey);
    const to = typeof job.recipient === "string" ? job.recipient.trim() : "";
    if (!to || !to.includes("@")) throw new Error("invalid email recipient");
    const threadId = await ensureThread(ctx.supabase, job.account_id, to, job.team_id, "email");
    const meta = (job.meta && typeof job.meta === "object") ? (job.meta as Record<string, unknown>) : {};
    const cc = Array.isArray((meta as any)["cc"]) ? ((meta as any)["cc"] as unknown[]).filter((v): v is string => typeof v === "string") : undefined;
    const bcc = Array.isArray((meta as any)["bcc"]) ? ((meta as any)["bcc"] as unknown[]).filter((v): v is string => typeof v === "string") : undefined;
    const subjectRaw = typeof (meta as any)["subject"] === "string" ? ((meta as any)["subject"] as string).trim() : "";
    const fallbackSubject = creds.defaultSubject || `Message from ${ctx.account.display_name || "Faworra"}`;
    const subject = subjectRaw || fallbackSubject;
    const bodies = buildEmailBodies(job.content || "", meta);

    type EmailPayload = { from: string; to: string; subject: string; html: string; text?: string; cc?: string[]; bcc?: string[]; reply_to?: string; headers?: Record<string, string> };
    const emailPayload: EmailPayload = { from: creds.fromName ? `${creds.fromName} <${fromEmail}>` : fromEmail, to, subject: String(subject), html: bodies.html, text: bodies.text || undefined };
    if (cc && cc.length) emailPayload.cc = cc;
    if (bcc && bcc.length) emailPayload.bcc = bcc;
    if (typeof creds.replyTo === "string" && creds.replyTo.includes("@")) emailPayload.reply_to = creds.replyTo;
    emailPayload.headers = { "X-Faworra-Thread": threadId };

    type ResendSendResult = { data?: { id?: string } | null; error?: { message?: string; name?: string; statusCode?: number } | null };
    let sendResult: ResendSendResult;
    try {
      sendResult = await resend.emails.send(emailPayload);
    } catch (err) {
      const e: any = err instanceof Error ? err : new Error(String(err));
      if (typeof e.statusCode === "number") (e as any).statusCode = e.statusCode;
      throw e;
    }
    const sendError = sendResult?.error ?? null;
    if (sendError) {
      const errMessage = typeof sendError === "object" && sendError ? ((sendError as any)?.message as string) || ((sendError as any)?.name as string) || JSON.stringify(sendError) : String(sendError);
      const err: any = new Error(`resend_error: ${errMessage}`);
      if (typeof (sendError as any)?.statusCode === "number") err.statusCode = (sendError as any).statusCode;
      throw err;
    }
    const providerMessageId = (sendResult?.data as any)?.id ?? null;
    const msgType = "text";
    return { providerMessageId, msgType, threadId };
  },
};
