import type { SendProvider, SendContext, SendResult } from "./send-registry";
import { ensureThread, formatJid, type OutboxJob } from "../services/outbox-helpers";
import { Registry as SocketRegistry } from "./registry";

export const WhatsAppProvider: SendProvider = {
  name: "whatsapp_baileys",
  async send(ctx: SendContext, job: OutboxJob): Promise<SendResult> {
    const sock = SocketRegistry.get(job.account_id) as any;
    if (!sock) throw new Error("baileys socket not available");
    const jid = formatJid(job.recipient);
    let sent: any;
    let msgType = "text";
    const threadId = await ensureThread(ctx.supabase, job.account_id, jid, job.team_id, "whatsapp");
    if (job.media_path && job.media_type) {
      msgType = job.media_type;
      const { data: fileData, error: dlErr } = await (ctx.supabase as any).storage
        .from("vault")
        .download(job.media_path);
      if (dlErr || !fileData) throw dlErr || new Error("download failed");
      const arrayBuf = await (fileData as Blob).arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (job.media_type === "image") {
        sent = await sock.sendMessage(jid, { image: buffer, caption: job.caption || undefined });
      } else if (job.media_type === "document") {
        sent = await sock.sendMessage(jid, { document: buffer, mimetype: "application/octet-stream", fileName: job.media_filename || "file" });
      } else if (job.media_type === "audio") {
        sent = await sock.sendMessage(jid, { audio: buffer, mimetype: "audio/mpeg" });
      } else if (job.media_type === "video") {
        sent = await sock.sendMessage(jid, { video: buffer, caption: job.caption || undefined });
      } else {
        sent = await sock.sendMessage(jid, { text: job.content || "" });
        msgType = "text";
      }
    } else {
      sent = await sock.sendMessage(jid, { text: job.content || "" });
    }
    const providerMessageId = sent?.key?.id || null;
    return { providerMessageId, msgType, threadId };
  },
};
