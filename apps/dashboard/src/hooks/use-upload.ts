import { createBrowserClient } from "@Faworra/supabase/client";
import { upload as uploadToSupabase } from "@Faworra/supabase/storage";
import { useState } from "react";

type UploadOptions = {
  file: File;
  path: string[];
  bucket?: string;
};

type UploadResult = {
  url: string;
  path: string[];
};

export function useUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();

  const uploadFile = async ({ file, path, bucket = "public" }: UploadOptions): Promise<UploadResult> => {
    setIsLoading(true);
    try {
      const url = await uploadToSupabase(supabase, {
        file,
        path,
        bucket,
      });

      return { url, path };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadFile,
    isLoading,
  } as const;
}
