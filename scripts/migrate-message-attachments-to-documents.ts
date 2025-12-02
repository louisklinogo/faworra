import "dotenv/config";
import { createServerClient } from "@Faworra/supabase/server";

async function main() {
  const supabase = await createServerClient({ admin: true });
  const pageSize = 500;
  let offset = 0;
  let processed = 0;
  let created = 0;

  // Fetch attachments with message + thread context in pages
  // We select storage_path, content_type, size, message_id, team_id, thread_id
  for (;;) {
    const { data, error } = await supabase
      .from("message_attachments")
      .select(
        `id, storage_path, content_type, size, message_id, communication_messages!inner(thread_id, team_id)`
      )
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    const rows = (data as any[]) || [];
    if (rows.length === 0) break;

    for (const r of rows) {
      processed++;
      const storagePath: string = r.storage_path;
      const mime: string | null = r.content_type;
      const size: number | null = r.size;
      const teamId: string = r.communication_messages?.team_id;
      const threadId: string = r.communication_messages?.thread_id;
      const messageId: string = r.message_id;

      if (!(teamId && storagePath)) continue;

      // Skip if a document with same name+team already exists
      const { data: existing, error: exErr } = await supabase
        .from("documents")
        .select("id")
        .eq("team_id", teamId)
        .eq("name", storagePath)
        .maybeSingle();
      if (exErr) throw exErr;
      if (existing?.id) continue;

      const { error: insErr } = await supabase.from("documents").insert({
        team_id: teamId,
        name: storagePath,
        path_tokens: storagePath.split("/"),
        mime_type: mime,
        size: typeof size === "number" ? size : null,
        processing_status: "completed",
        metadata: {
          source: "inbox",
          channel: "whatsapp",
          thread_id: threadId,
          message_id: messageId,
        } as any,
      });
      if (!insErr) created++;
    }

    offset += rows.length;
    if (rows.length < pageSize) break;
  }

  console.log(`Backfill completed. processed=${processed} created=${created}`);
}

main().catch((e) => {
  console.error("Backfill failed", e);
  process.exit(1);
});
