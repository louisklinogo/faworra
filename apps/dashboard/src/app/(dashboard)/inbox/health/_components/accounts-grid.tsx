"use client";

import { useMemo, useState } from "react";
import { RiInstagramFill, RiMailFill, RiWhatsappFill } from "react-icons/ri";
import { DeleteChannelSheet } from "@/components/inbox/delete-channel-sheet";
import { WhatsAppModal } from "@/components/inbox/whatsapp-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

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

export function AccountsGrid({ initialRows }: { initialRows: Row[] }) {
  const utils = trpc.useUtils();
  const [selectedAccount, setSelectedAccount] = useState<{
    externalId: string;
    displayName: string | null;
  } | null>(null);
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

  const rows = initialRows;

  const expiryInfo = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const ts = Date.parse(expiresAt);
    if (Number.isNaN(ts)) return null;
    const diffDays = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
    return `${diffDays}d`;
  };

  const providerIcon = (provider: string) => {
    if (provider.startsWith("whatsapp")) return <RiWhatsappFill size={18} />;
    if (provider.startsWith("instagram")) return <RiInstagramFill size={18} />;
    if (provider.includes("gmail") || provider.startsWith("email_")) return <RiMailFill size={18} />;
    return null;
  };

  const providerLabel = (provider: string) => {
    if (provider === "whatsapp_baileys") return "WhatsApp (Baileys)";
    if (provider === "whatsapp_meta") return "WhatsApp Cloud API";
    if (provider === "whatsapp_twilio") return "WhatsApp (Twilio)";
    if (provider === "instagram_meta") return "Instagram";
    if (provider === "email_resend") return "Email (Resend)";
    if (provider === "gmail") return "Gmail";
    return provider;
  };

  function StatusPill({
    status,
  }: {
    status: "connected" | "disconnected" | "error" | "pending" | string;
  }) {
    const st = status as any as "connected" | "disconnected" | "error" | "pending";
    const cfg =
      st === "connected"
        ? { bg: "bg-emerald-50", fg: "text-emerald-700", dot: "bg-emerald-600", pulse: false }
        : st === "pending"
          ? { bg: "bg-sky-50", fg: "text-sky-700", dot: "bg-sky-600", pulse: true }
          : st === "error"
            ? { bg: "bg-red-50", fg: "text-red-700", dot: "bg-red-600", pulse: true }
            : { bg: "bg-amber-50", fg: "text-amber-700", dot: "bg-amber-600", pulse: true };
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cfg.bg} ${cfg.fg}`}
      >
        <span className="relative inline-flex h-1.5 w-1.5">
          {cfg.pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${cfg.dot}`}
            />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        </span>
        {status}
      </span>
    );
  }

  const igReauth = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${base}/providers/instagram/oauth/start`, { method: "POST" });
      const json = await res.json();
      if (json?.url) window.open(json.url, "_blank");
    } catch {}
  };

  const healthyCount = useMemo(() => rows.filter((r) => r.status === "connected").length, [rows]);

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded border bg-muted/30 p-6 text-sm text-muted-foreground">
        No channels connected.{" "}
        <a className="ml-2 underline" href="/inbox/conversations">
          Connect a channel
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {rows.map((a) => {
          const borderTint =
            a.status === "error"
              ? "border-red-200"
              : a.status === "disconnected"
                ? "border-amber-200"
                : a.status === "pending"
                  ? "border-sky-200"
                  : "border";
          return (
            <Card key={a.id} className={`${borderTint}`}>
              <CardHeader className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {providerIcon(a.provider)}
                    <CardTitle className="text-sm">{providerLabel(a.provider)}</CardTitle>
                  </div>
                  <StatusPill status={a.status} />
                </div>
              </CardHeader>
              <CardContent className="px-5 pt-0 pb-4">
                <div className="mb-1 font-medium">{a.displayName || a.externalId}</div>
                <div className="text-muted-foreground text-xs">
                  ID: <span className="font-mono">{a.externalId}</span>
                  {a.expiresAt ? (
                    <span className="ml-2">· expires in {expiryInfo(a.expiresAt)}</span>
                  ) : null}
                </div>

                {a.failures.length > 0 && (
                  <div className="mt-2 rounded-md bg-amber-50 p-2">
                    <div className="mb-1 text-[11px] font-medium text-amber-800">
                      Recent failures
                    </div>
                    <ul className="space-y-1 text-[11px] text-amber-900">
                      {a.failures.slice(0, 2).map((f) => (
                        <li key={f.id} className="truncate">
                          {new Date(f.created_at).toLocaleString()} · {f.error || "Unknown error"}
                        </li>
                      ))}
                      {a.failures.length > 2 ? (
                        <li className="text-muted-foreground">+{a.failures.length - 2} more…</li>
                      ) : null}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end gap-2">
                  {a.provider === "instagram_meta" && (
                    <Button size="sm" variant="outline" onClick={igReauth}>
                      Reauthorize
                    </Button>
                  )}
                  {a.provider.startsWith("whatsapp") && (
                    <Button
                      aria-label="Reconnect"
                      disabled={reconnect.isPending || startingId === a.id}
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
                          await reconnect.mutateAsync({ accountId: a.id });
                          setSelectedAccount({
                            externalId: a.externalId,
                            displayName: a.displayName,
                          });
                        } finally {
                          setStartingId(null);
                        }
                      }}
                    >
                      {startingId === a.id ? "Opening…" : "View QR"}
                    </Button>
                  )}
                  <Button asChild size="sm" variant="secondary">
                    <a href="/inbox/settings">Manage</a>
                  </Button>
                  <Button
                    aria-label="Disconnect"
                    disabled={disconnect.isPending}
                    size="sm"
                    variant="ghost"
                    onClick={() => disconnect.mutate({ accountId: a.id })}
                  >
                    Disconnect
                  </Button>
                  <Button
                    aria-label="Delete"
                    className="text-destructive-foreground"
                    disabled={remove.isPending}
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteAccount(a)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {healthyCount === rows.length ? (
        <div className="rounded border bg-green-50 p-3 text-sm text-green-700">
          All channels healthy
        </div>
      ) : null}

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
        provider={deleteAccount ? providerLabel(deleteAccount.provider) : "this channel"}
      />
    </div>
  );
}
