"use client";

import { useState } from "react";
import type { IconType } from "react-icons";
import { RiInstagramFill, RiMailFill, RiWhatsappFill } from "react-icons/ri";
import { DeleteChannelSheet } from "@/components/inbox/delete-channel-sheet";
import { WhatsAppModal } from "@/components/inbox/whatsapp-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { DisconnectChannelSheet } from "./disconnect-channel-sheet";
import { ConfigureEmailChannelDialog } from "./configure-email-channel-dialog";

interface Account {
  id: string;
  provider: string;
  externalId: string;
  displayName: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  initialAccounts: Account[];
}

interface ProviderConfig {
  name: string;
  icon: IconType;
}

const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  whatsapp_baileys: {
    name: "WhatsApp (Baileys)",
    icon: RiWhatsappFill,
  },
  whatsapp_twilio: {
    name: "WhatsApp (Twilio)",
    icon: RiWhatsappFill,
  },
  whatsapp_meta: {
    name: "WhatsApp Cloud API",
    icon: RiWhatsappFill,
  },
  instagram_meta: {
    name: "Instagram",
    icon: RiInstagramFill,
  },
  email_resend: {
    name: "Email (Resend)",
    icon: RiMailFill,
  },
  gmail: {
    name: "Gmail",
    icon: RiMailFill,
  },
};

export function ConnectedChannelsTable({ initialAccounts }: Props) {
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [disconnectProvider, setDisconnectProvider] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteProvider, setDeleteProvider] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<{
    externalId: string;
    displayName: string | null;
  } | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [configAccount, setConfigAccount] = useState<{ id: string; label: string } | null>(null);
  const utils = trpc.useUtils();

  const { data: accounts = initialAccounts } = trpc.communications.accounts.useQuery(undefined, {
    initialData: initialAccounts,
  });

  const disconnect = trpc.communications.disconnect.useMutation({
    onSuccess: async () => {
      setDisconnectId(null);
      await utils.communications.accounts.invalidate();
    },
  });

  const reconnect = trpc.communications.reconnect.useMutation({
    onSuccess: async () => {
      await utils.communications.accounts.invalidate();
    },
  });
  const remove = trpc.communications.delete.useMutation({
    onSuccess: async () => {
      setDeleteId(null);
      await utils.communications.accounts.invalidate();
    },
  });

  if (accounts.length === 0) {
    return (
      <Card className="border-0">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <div className="mb-4 text-muted-foreground text-sm">No channels connected yet</div>
            <Button asChild>
              <a href="/inbox/conversations">Connect a channel</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    connected: "default",
    disconnected: "secondary",
    error: "destructive",
  };

  return (
    <>
      {accounts.some((a) => a.status !== "connected") && (
        <Card className="mb-4 border-0">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">Some channels need attention</div>
              <Button asChild size="sm" variant="outline">
                <a href="/inbox/health">Review health</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Connected Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Identity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => {
                  const config = PROVIDER_CONFIG[account.provider];
                  const Icon = config?.icon;
                  const displayLabel = account.displayName || account.externalId;

                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon size={20} />}
                          <span className="font-medium text-sm">
                            {config?.name || account.provider}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">{displayLabel}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[account.status] || "secondary"}>
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-xs">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-label="Actions" size="icon" variant="ghost">
                              <Icons.MoreHoriz className="size-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {account.provider.startsWith("whatsapp") ? (
                              <>
                                <DropdownMenuItem
                                  disabled={startingId === account.id}
                                  onClick={async () => {
                                    if (startingId) return;
                                    setStartingId(account.id);
                                    try {
                                      const base =
                                        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                                      await fetch(
                                        `${base}/providers/whatsapp/baileys/session/start`,
                                        {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            externalId: account.externalId,
                                            displayName: account.displayName || account.externalId,
                                          }),
                                        },
                                      );
                                      setSelectedAccount({
                                        externalId: account.externalId,
                                        displayName: account.displayName,
                                      });
                                    } finally {
                                      setStartingId(null);
                                    }
                                  }}
                                >
                                  {startingId === account.id ? "Opening…" : "View QR"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={reconnect.isPending}
                                  onClick={() => reconnect.mutate({ accountId: account.id })}
                                >
                                  Reconnect
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                disabled={reconnect.isPending}
                                onClick={() => reconnect.mutate({ accountId: account.id })}
                              >
                                Reconnect
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setDisconnectId(account.id);
                                setDisconnectProvider(config?.name || account.provider);
                              }}
                            >
                              Disconnect
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setDeleteId(account.id);
                                setDeleteProvider(config?.name || account.provider);
                              }}
                            >
                              Delete connection
                            </DropdownMenuItem>
                            {account.provider === "email_resend" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfigAccount({
                                    id: account.id,
                                    label: config?.name || account.provider,
                                  })
                                }
                              >
                                Configure email
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DisconnectChannelSheet
        isLoading={disconnect.isPending}
        onConfirm={async () => {
          if (disconnectId) {
            await disconnect.mutateAsync({ accountId: disconnectId });
          }
        }}
        onOpenChange={(open) => {
          if (!open) setDisconnectId(null);
        }}
        open={disconnectId !== null}
        provider={disconnectProvider}
      />
      <DeleteChannelSheet
        isLoading={remove.isPending}
        onConfirm={async () => {
          if (deleteId) {
            await remove.mutateAsync({ accountId: deleteId });
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
            setDeleteProvider("");
          }
        }}
        open={deleteId !== null}
        provider={deleteProvider}
      />
      <WhatsAppModal
        externalId={selectedAccount?.externalId ?? ""}
        isOpen={selectedAccount !== null}
        onClose={() => setSelectedAccount(null)}
        onConnected={async () => {
          setSelectedAccount(null);
          await utils.communications.accounts.invalidate();
        }}
      />
      <ConfigureEmailChannelDialog
        accountId={configAccount?.id ?? null}
        onOpenChange={(open) => {
          if (!open) setConfigAccount(null);
        }}
        open={configAccount !== null}
        providerLabel={configAccount?.label ?? "Email"}
      />
    </>
  );
}
