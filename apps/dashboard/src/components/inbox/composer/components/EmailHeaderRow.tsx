"use client";

import { TagInput } from "@/components/tag-input";

type EmailHeaderRowProps = {
  to: string[];
  cc: string[];
  bcc: string[];
  onToChange: (values: string[]) => void;
  onCcChange: (values: string[]) => void;
  onBccChange: (values: string[]) => void;
};

export function EmailHeaderRow({ to, cc, bcc, onToChange, onCcChange, onBccChange }: EmailHeaderRowProps) {
  return (
    <div className="space-y-3 border-t px-3 py-3">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">To</p>
          <TagInput onChange={onToChange} placeholder="Add recipients" value={to} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">CC</p>
          <TagInput onChange={onCcChange} placeholder="Add CC" value={cc} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">BCC</p>
          <TagInput onChange={onBccChange} placeholder="Add BCC" value={bcc} />
        </div>
      </div>
    </div>
  );
}

export default EmailHeaderRow;
