import type { SupabaseClient } from "@supabase/supabase-js";

export type UploadParams = {
  file: File;
  path: string[];
  bucket: string;
};

export async function upload(client: SupabaseClient, { file, path, bucket }: UploadParams) {
  const storage = client.storage.from(bucket);
  const key = path.filter((segment) => segment && segment.trim().length > 0).join("/");

  if (!key) {
    throw new Error("Upload path cannot be empty");
  }

  const result = await storage.upload(key, file, {
    upsert: true,
    cacheControl: "3600",
  });

  if (result.error) {
    throw result.error;
  }

  return storage.getPublicUrl(key).data.publicUrl;
}
