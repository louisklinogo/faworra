"use client";

import { Button } from "@/components/ui/button";

type Member = { id: string; fullName?: string | null; email?: string | null };

export function AssignDialog({
  open,
  members,
  onAssign,
  onClose,
}: {
  open: boolean;
  members: Member[];
  onAssign: (assignedUserId: string | null) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-black/20 p-10">
      <div className="w-full max-w-sm rounded-md border bg-background p-2 shadow-lg">
        <div className="mb-2 px-2 text-xs text-muted-foreground">Assign to… (Esc to close)</div>
        <div className="max-h-64 overflow-auto">
          <button
            className="w-full rounded px-2 py-1 text-left text-sm hover:bg-muted"
            onClick={() => {
              onAssign(null);
              onClose();
            }}
            type="button"
          >
            Unassigned
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              className="w-full rounded px-2 py-1 text-left text-sm hover:bg-muted"
              onClick={() => {
                onAssign(m.id);
                onClose();
              }}
              type="button"
            >
              {m.fullName || m.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AssignDialog;
