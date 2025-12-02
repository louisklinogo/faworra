"use server";

import { createServerClient } from "@Faworra/supabase/server";

export async function uploadProductMedia(formData: FormData) {
  const file = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;

  if (!file) {
    return { error: "No file provided" } as const;
  }
  if (!productId) {
    return { error: "Missing productId" } as const;
  }

  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image" } as const;
  }
  const KB = 1024;
  const MB = KB * KB;
  const MAX_MEDIA_MB = 10;
  const MAX_MEDIA_BYTES = MAX_MEDIA_MB * MB;
  if (file.size > MAX_MEDIA_BYTES) {
    return { error: "File size must be < 10MB" } as const;
  }

  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" } as const;
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("current_team_id")
      .eq("id", user.id)
      .single<{ current_team_id: string | null }>();

    const teamId = userRow?.current_team_id;
    if (!teamId) {
      return { error: "No team selected" } as const;
    }

    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const RADIX_36 = 36;
    const RANDOM_SLICE_FROM = 2;
    const key = `${teamId}/${productId}/${Date.now()}-${Math.random()
      .toString(RADIX_36)
      .slice(RANDOM_SLICE_FROM)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
      .from("product-media")
      .upload(key, buffer, { contentType: file.type, upsert: false, cacheControl: "3600" });
    if (error) {
      return { error: error.message } as const;
    }

    const { data: pub } = supabase.storage.from("product-media").getPublicUrl(data.path);
    return { url: pub.publicUrl } as const;
  } catch (e: any) {
    return { error: e?.message || "Upload failed" } as const;
  }
}
