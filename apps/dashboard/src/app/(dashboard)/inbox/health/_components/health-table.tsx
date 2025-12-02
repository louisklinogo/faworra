"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { WhatsAppModal } from "@/components/inbox/whatsapp-modal";
import { DeleteChannelSheet } from "@/components/inbox/delete-channel-sheet";

type Failure = { id: string; created_at: string; error: string | null };
type Row = {
  id: string;
  provider: string;
  externalId: string;
  displayName: string | null;
  status: string;
  expiresAt: string | null;
  failures: Failure[];
};

export function HealthTable({ initialRows }: { initialRows: Row[] }) {
  const utils = trpc.useUtils();
  const [selectedAccount, setSelectedAccount] = useState<{ externalId: string; displayName: string | null } | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<Row | null>(null);
  const reconnect = trpc.communications.reconnect.useMutation({
    onSuccess: () => utils.communications.accounts.invalidate(),
  });
  const disconnect = trpc.communications.disconnect.useMutation({
    onSuccess: () => utils.communications.accounts.invalidate(),
  });
  const remove = trpc.communications.delete.useMutation({
    onSuccess: async () => {
      setDeleteAccount(null);
      await utils.communications.accounts.invalidate();
    },
  });

  const now = Date.now();
  const rows = initialRows;

  const expiryInfo = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const ts = Date.parse(expiresAt);
    if (Number.isNaN(ts)) return null;
    const diffDays = Math.ceil((ts - now) / (1000 * 60 * 60 * 24));
    return `${diffDays}d`;
  };

  const handleIgReauth = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${base}/providers/instagram/oauth/start`, { method: "POST" });
      const json = await res.json();
      if (json?.url) window.open(json.url, "_blank");
    } catch {}
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="text-muted-foreground text-sm">No channels connected</div>
      ) : null}
      {rows.map((a) => (
        <div key={a.id} className="rounded border p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{a.provider}</div>
              <div className="text-muted-foreground text-xs">{a.displayName || a.externalId}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${a.status === "connected" ? "text-green-600" : "text-red-600"}`}>{a.status}</span>
              {a.expiresAt && (
                <span className="text-xs text-muted-foreground">expires in {expiryInfo(a.expiresAt)}</span>
              )}
              {a.provider === "instagram_meta" && (
                <Button size="sm" variant="outline" onClick={handleIgReauth}>
                  Reauthorize
                </Button>
              )}
              {a.provider.startsWith("whatsapp") && (
                <Button
                  disabled={startingId === a.id}
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (startingId) return;
                    setStartingId(a.id);
                    try {
                      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                      await fetch(`${base}/providers/whatsapp/baileys/session/start`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          externalId: a.externalId,
                          displayName: a.displayName || a.externalId,
                        }),
                      });
                      setSelectedAccount({ externalId: a.externalId, displayName: a.displayName });
                    } finally {
                      setStartingId(null);
                    }
                  }}
                >
                  {startingId === a.id ? "Opening…" : "View QR"}
                </Button>
              )}
              {a.provider.startsWith("whatsapp") && (
                <Button
                  disabled={reconnect.isPending}
                  size="sm"
                  variant="outline"
                  onClick={() => reconnect.mutate({ accountId: a.id })}
                >
                  Restart
                </Button>
              )}
              <Button
                disabled={disconnect.isPending}
                size="sm"
                variant="ghost"
                onClick={() => disconnect.mutate({ accountId: a.id })}
              >
                Disconnect
              </Button>
              <Button
                disabled={remove.isPending}
                size="sm"
                variant="destructive"
                onClick={() => setDeleteAccount(a)}
              >
                Delete
              </Button>
            </div>
          </div>
          {a.failures.length > 0 && (
            <div className="mt-2 rounded bg-amber-50 p-2">
              <div className="mb-1 text-[11px] font-medium text-amber-800">Recent failures</div>
              <ul className="space-y-1 text-[11px] text-amber-900">
                {a.failures.map((f) => (
                  <li key={f.id} className="truncate">
                    {new Date(f.created_at).toLocaleString()} · {f.error || "Unknown error"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      <WhatsAppModal
        externalId={selectedAccount?.externalId ?? ""}
        isOpen={selectedAccount !== null}
        onClose={() => setSelectedAccount(null)}
        onConnected={async () => {
          setSelectedAccount(null);
          await utils.communications.accounts.invalidate();
        }}
      />
      <DeleteChannelSheet
        isLoading={remove.isPending}
        onConfirm={async () => {
          if (deleteAccount) {
            await remove.mutateAsync({ accountId: deleteAccount.id });
          }
        }}
        onOpenChange={(open) => {
          if (!open) setDeleteAccount(null);
        }}
        open={deleteAccount !== null}
        provider={deleteAccount?.displayName || deleteAccount?.externalId || "this channel"}
      />
    </div>
  );
}
