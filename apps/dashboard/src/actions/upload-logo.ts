"use server";

import { createServerClient } from "@Faworra/supabase/server";

export async function uploadLogo(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image" };
  }

  // Validate file size (max 2MB)
  const KB = 1024;
  const MB = KB * KB;
  const MAX_LOGO_MB = 2;
  const MAX_LOGO_BYTES = MAX_LOGO_MB * MB;
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "File size must be less than 2MB" };
  }

  try {
    const supabase = await createServerClient();

    // Get user (server-verified)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    // Get user's team ID
    const { data: userData } = await supabase
      .from("users")
      .select("current_team_id")
      .eq("id", user.id)
      .single<{ current_team_id: string | null }>();

    if (!userData?.current_team_id) {
      return { error: "No team selected" };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const RADIX_36 = 36;
    const RANDOM_SUBSTR_START = 7;
    const fileName = `${userData.current_team_id}/${Date.now()}-${Math.random()
      .toString(RADIX_36)
      .substring(RANDOM_SUBSTR_START)}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("invoice-logos").upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return { error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("invoice-logos").getPublicUrl(data.path);

    return { url: publicUrl };
  } catch {
    return { error: "Failed to upload logo" };
  }
}

export async function deleteLogo(url: string) {
  try {
    const supabase = await createServerClient();

    // Get user (server-verified)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    // Extract path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const filePath = pathParts.slice(pathParts.indexOf("invoice-logos") + 1).join("/");

    // Delete from storage
    const { error } = await supabase.storage.from("invoice-logos").remove([filePath]);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch {
    return { error: "Failed to delete logo" };
  }
}
