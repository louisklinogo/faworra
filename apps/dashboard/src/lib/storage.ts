export function getProductMediaUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/product-media/${path}`;
}

export function getProductMediaThumb(path: string, width = 400) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const w = Math.max(64, Math.min(1280, Math.floor(width)));
  return `${base}/storage/v1/render/image/public/product-media/${path}?width=${w}&quality=70&format=webp`;
}
