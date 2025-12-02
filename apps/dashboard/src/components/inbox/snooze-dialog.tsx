"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function SnoozeDialog({
  open,
  defaultAt,
  onApply,
  onClose,
}: {
  open: boolean;
  defaultAt?: string;
  onApply: (iso: string) => void;
  onClose: () => void;
}) {
  const [snoozeAt, setSnoozeAt] = useState<string>(defaultAt || "");
  useEffect(() => setSnoozeAt(defaultAt || ""), [defaultAt]);
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-black/20 p-10">
      <div className="w-full max-w-md rounded-md border bg-background p-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Snooze until</div>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => {
            const d = new Date(); d.setHours(d.getHours() + 1); setSnoozeAt(d.toISOString().slice(0,16));
          }}>In 1 hour</Button>
          <Button size="sm" variant="outline" onClick={() => {
            const d = new Date(); d.setHours(16,0,0,0); if (d < new Date()) d.setDate(d.getDate()+1); setSnoozeAt(d.toISOString().slice(0,16));
          }}>Today 4pm</Button>
          <Button size="sm" variant="outline" onClick={() => {
            const d = new Date(); d.setDate(d.getDate()+1); d.setHours(9,0,0,0); setSnoozeAt(d.toISOString().slice(0,16));
          }}>Tomorrow 9am</Button>
        </div>
        <div className="flex items-center gap-2">
          <input
            aria-label="Snooze until"
            className="rounded border px-2 py-1 text-sm"
            onChange={(e) => setSnoozeAt(e.target.value)}
            type="datetime-local"
            value={snoozeAt}
          />
          <Button
            disabled={!snoozeAt}
            onClick={() => {
              const iso = new Date(snoozeAt).toISOString();
              onApply(iso);
            }}
            size="sm"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SnoozeDialog;
