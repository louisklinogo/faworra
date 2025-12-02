export function publicStorageUrl(bucket: string, path?: string | null): string | null {
  if (!path) return null;
  // Accept absolute URLs as-is
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
