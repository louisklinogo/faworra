"use client";

import { MdClose } from "react-icons/md";
import { Progress } from "@/components/ui/progress";

type AttachmentListProps = {
  attachments: File[];
  previews: Record<string, string>;
  uploadProgress: Record<string, number>;
  uploading: boolean;
  onRemove: (index: number) => void;
};

export function AttachmentList({ attachments, previews, uploadProgress, uploading, onRemove }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {attachments.map((file, idx) => {
        const key = `${file.name}-${file.lastModified}`;
        const pct = uploadProgress[key] ?? 0;
        const isImage = file.type?.startsWith("image/") && previews[key];

        return (
          <div className="flex items-center gap-3 rounded-md bg-muted/60 p-2 text-xs" key={`${file.name}-${idx}`}>
            {isImage ? (
              <img alt={file.name} className="h-8 w-8 rounded object-cover" src={previews[key]} />
            ) : (
              <div className="h-8 w-8 rounded bg-muted-foreground/10" />
            )}
            <span className="max-w-[220px] truncate">{file.name}</span>
            {uploading && (
              <div className="flex-1">
                <Progress value={pct} />
              </div>
            )}
            <button
              aria-label={uploading ? "Cancel upload" : "Remove attachment"}
              className="text-muted-foreground transition hover:text-foreground"
              onClick={() => onRemove(idx)}
              type="button"
            >
              <MdClose className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
