"use client";

import { publicStorageUrl } from "@Faworra/services/storage/public-url";
import Image from "next/image";

type Props = {
  bucket: string;
  path?: string | null;
  alt?: string;
  width: number;
  height: number;
  className?: string;
};

export function SupabaseImage({ bucket, path, alt = "", width, height, className }: Props) {
  const src = publicStorageUrl(bucket, path);
  if (!src) {
    return <div aria-hidden className={className} style={{ width, height }} />;
  }
  return <Image alt={alt} className={className} height={height} src={src} width={width} />;
}
