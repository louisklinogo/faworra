"use client";

import { createBrowserClient } from "@Faworra/supabase/client";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiInstagramFill, RiMailFill, RiWhatsappFill } from "react-icons/ri";
import { startBaileysSessionAction } from "@/actions/providers/start-baileys-session";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { WizardShell } from "@/components/ui/wizard-shell";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc/client";
import { ChannelDetailsSheet } from "./channel-details-sheet";
import { InstagramStep, ProviderSelectionStep, WhatsAppConfigStep, WhatsAppQrStep } from "./connect-channels-stages";
import { StepIndicator } from "@/components/ui/step-indicator";
import type { Provider, ProviderId, WizardStage } from "./connect-channels-types";
import { nextUniqueId, slugify } from "./connect-channels-utils";

type ConnectChannelsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ConnectChannelsModal({ open, onOpenChange }: ConnectChannelsModalProps) {
  const [stage, setStage] = useState<WizardStage>("list");
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId | null>(null);
  const [query, setQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsChannel, setDetailsChannel] = useState<{
    id: string;
    name: string;
    logo: React.ComponentType;
    category: string;
    description: string;
    installed: boolean;
    active: boolean;
  } | null>(null);
  const [waDisplayName, setWaDisplayName] = useState("WhatsApp");
  const [waExternalId, setWaExternalId] = useState("");
  const [waExternalTouched, setWaExternalTouched] = useState(false);
  const [whatsappExternalId, setWhatsappExternalId] = useState("");
  const [isWhatsAppSubmitting, setIsWhatsAppSubmitting] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [instagramConnecting, setInstagramConnecting] = useState(false);
  const { data: accounts = [] } = trpc.communications.accounts.useQuery(undefined, {
    staleTime: 10_000,
    enabled: open,
  });
  const { toast } = useToast();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const qrPollRef = useRef<NodeJS.Timeout | null>(null);
  const qrFailureRef = useRef(0);
  const qrSseAbortRef = useRef<AbortController | null>(null);

  const waAccounts = (accounts || []).filter((a) => a.provider === "whatsapp_baileys");

  const resetWizard = useCallback(() => {
    setStage("list");
    setSelectedProviderId(null);
    setQuery("");
    setWaDisplayName("WhatsApp");
    setWaExternalId("");
    setWaExternalTouched(false);
    setWhatsappExternalId("");
    setIsWhatsAppSubmitting(false);
    setQrCodeUrl("");
    setQrLoading(false);
    setInstagramConnecting(false);
    if (qrPollRef.current) {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
    }
    qrFailureRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (qrPollRef.current) {
        clearInterval(qrPollRef.current);
      }
    };
  }, []);

  const beginWhatsAppSetup = useCallback(() => {
    const count = waAccounts.length;
    const nextNum = count + 1;
    const name = `WhatsApp Line ${nextNum}`;
    const taken = new Set(waAccounts.map((a) => a.externalId));
    const base = slugify(name) || `whatsapp_line_${nextNum}`;
    const unique = nextUniqueId(base, taken);
    setWaDisplayName(name);
    setWaExternalId(unique);
    setWaExternalTouched(false);
    setStage("whatsapp-config");
    setSelectedProviderId("whatsapp-baileys");
  }, [waAccounts]);

  const startBaileysInstall = useCallback(async () => {
    const normalizedId = slugify(waExternalId);
    if (!normalizedId) return;
    setIsWhatsAppSubmitting(true);
    try {
      await startBaileysSessionAction({
        externalId: normalizedId,
        displayName: waDisplayName.trim() || "WhatsApp",
      });
      setWhatsappExternalId(normalizedId);
      setWaExternalId(normalizedId);
      setQrCodeUrl("");
      qrFailureRef.current = 0;
      setStage("whatsapp-qr");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start WhatsApp session";
      toast({ title: "Couldn’t start WhatsApp", description: msg });
    } finally {
      setIsWhatsAppSubmitting(false);
    }
  }, [toast, waDisplayName, waExternalId]);

  const beginInstagramFlow = useCallback(() => {
    setStage("instagram");
    setSelectedProviderId("instagram");
  }, []);

  const handleDisplayNameChange = useCallback(
    (value: string) => {
      setWaDisplayName(value);
      if (!waExternalTouched) {
        const taken = new Set(waAccounts.map((account) => account.externalId));
        const base = slugify(value) || "whatsapp_line";
        setWaExternalId(nextUniqueId(base, taken));
      }
    },
    [waAccounts, waExternalTouched],
  );

  const handleExternalIdChange = useCallback((value: string) => {
    setWaExternalId(value.toLowerCase());
    setWaExternalTouched(true);
  }, []);

  const providers: Provider[] = useMemo(
    () => [
      {
        id: "whatsapp-baileys",
        name: "WhatsApp (Baileys)",
        description:
          "Pair your phone via QR (Baileys). Self-hosted session for sending and receiving messages.",
        Logo: RiWhatsappFill,
        iconSize: 20,
        onSelect: beginWhatsAppSetup,
      },
      {
        id: "whatsapp-360dialog",
        name: "WhatsApp (360dialog)",
        description:
          "Official BSP via 360dialog. API key-based; stable template messaging and webhooks.",
        Logo: RiWhatsappFill,
        disabled: true,
        iconSize: 20,
      },
      {
        id: "whatsapp-cloud",
        name: "WhatsApp Cloud API",
        description:
          "Official Meta Cloud API. No phone pairing; uses app tokens. Stable and scalable.",
        Logo: RiWhatsappFill,
        disabled: true,
        iconSize: 20,
      },
      {
        id: "whatsapp-twilio",
        name: "WhatsApp (Twilio)",
        description: "Twilio WhatsApp messaging with Messaging Service SID or phone number.",
        Logo: RiWhatsappFill,
        disabled: true,
        iconSize: 20,
      },
      {
        id: "instagram",
        name: "Instagram Direct",
        description: "Connect your Instagram Business account to send and receive Direct Messages.",
        Logo: RiInstagramFill,
        iconSize: 20,
        onSelect: beginInstagramFlow,
      },
      {
        id: "gmail",
        name: "Email (Gmail)",
        description: "Ingest customer emails from Gmail into your unified inbox (read-only).",
        Logo: RiMailFill,
        disabled: true,
        iconSize: 20,
      },
    ],
    [beginInstagramFlow, beginWhatsAppSetup],
  );

  const handleInstagramConnect = useCallback(async () => {
    setInstagramConnecting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${base}/providers/instagram/oauth/start`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start Instagram OAuth");
      const data = (await res.json()) as { url?: string };
      if (data?.url) {
        const popup = window.open(data.url, "_blank");
        if (!popup) {
          toast({
            title: "Popup blocked",
            description: "Allow popups or open the link from the address bar.",
          });
        }
      }
    } catch (_error) {
      const description =
        _error instanceof Error ? _error.message : "Failed to start Instagram OAuth";
      toast({ title: "Couldn’t start Instagram connect", description });
    } finally {
      setInstagramConnecting(false);
    }
  }, [toast]);

  const handleInstagramFinished = useCallback(() => {
    router.refresh();
    resetWizard();
    onOpenChange(false);
  }, [onOpenChange, resetWizard, router]);

  const handleCloseWizard = useCallback(() => {
    resetWizard();
    onOpenChange(false);
  }, [onOpenChange, resetWizard]);

  const fetchQr = useCallback(async (silent = false) => {
    if (!whatsappExternalId) return;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    if (!silent) setQrLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${base}/providers/whatsapp/baileys/session/qr?externalId=${encodeURIComponent(whatsappExternalId)}`,
        {
          cache: "no-store",
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        },
      );
      if (!res.ok) throw new Error("Failed to load QR");
      const json = await res.json();
      if (json?.status === "connected") {
        toast({ title: "WhatsApp connected", description: "Your WhatsApp line is now active." });
        resetWizard();
        onOpenChange(false);
        router.refresh();
        return;
      }
      if (json?.qr) {
        const dataUrl = await QRCode.toDataURL(json.qr, { width: 256, margin: 2 });
        setQrCodeUrl(dataUrl);
        qrFailureRef.current = 0;
      }
    } catch (_error) {
      qrFailureRef.current += 1;
      if (qrFailureRef.current % 3 === 0) {
        toast({
          title: "Couldn’t load QR",
          description: "We’ll keep retrying. Click Refresh QR to try now.",
        });
      }
    } finally {
      if (!silent) setQrLoading(false);
    }
  }, [onOpenChange, resetWizard, router, supabase, toast, whatsappExternalId]);

  // Prefer SSE-like streaming via fetch with Authorization header; fallback to polling
  useEffect(() => {
    async function startQrStream() {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token || !whatsappExternalId) return false;
        const controller = new AbortController();
        qrSseAbortRef.current = controller;
        const res = await fetch(
          `${base}/providers/whatsapp/baileys/session/qr/stream?externalId=${encodeURIComponent(whatsappExternalId)}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            signal: controller.signal,
          },
        );
        if (!res.ok || !res.body) return false;
        // Stop polling when stream active
        if (qrPollRef.current) {
          clearInterval(qrPollRef.current);
          qrPollRef.current = null;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n\n")) !== -1) {
            const raw = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const lines = raw.split("\n");
            let dataLine = lines.find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const jsonStr = dataLine.replace(/^data:\s?/, "");
            try {
              const payload = JSON.parse(jsonStr) as { status?: string; qr?: string | null };
              if (payload.status === "connected") {
                toast({ title: "WhatsApp connected", description: "Your WhatsApp line is now active." });
                resetWizard();
                onOpenChange(false);
                router.refresh();
                controller.abort();
                return true;
              }
              if (payload.qr) {
                const dataUrl = await QRCode.toDataURL(payload.qr, { width: 256, margin: 2 });
                setQrCodeUrl(dataUrl);
                qrFailureRef.current = 0;
              }
            } catch {
              // ignore parse errors
            }
          }
        }
        return true;
      } catch {
        return false;
      }
    }

    if (stage !== "whatsapp-qr") {
      if (qrPollRef.current) {
        clearInterval(qrPollRef.current);
        qrPollRef.current = null;
      }
      if (qrSseAbortRef.current) {
        qrSseAbortRef.current.abort();
        qrSseAbortRef.current = null;
      }
      return;
    }

    // Try streaming; if it fails, fallback to polling
    startQrStream().then((ok) => {
      if (ok) return;
      fetchQr(true);
      qrPollRef.current = setInterval(() => fetchQr(true), 2000);
    });

    return () => {
      if (qrPollRef.current) {
        clearInterval(qrPollRef.current);
        qrPollRef.current = null;
      }
      if (qrSseAbortRef.current) {
        qrSseAbortRef.current.abort();
        qrSseAbortRef.current = null;
      }
    };
  }, [fetchQr, onOpenChange, resetWizard, router, stage, supabase, whatsappExternalId]);

  const filtered = useMemo(
    () =>
      providers.filter((p) =>
        `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [providers, query],
  );

  const openDetails = (prov: Provider) => {
    const category = prov.id === "gmail" ? "Email" : "Messaging";
    const LogoComp = prov.Logo as unknown as React.ComponentType;
    setDetailsChannel({
      id: prov.id,
      name: prov.name,
      logo: LogoComp,
      category,
      description: prov.description,
      installed: false,
      active: !prov.disabled,
    });
    setDetailsOpen(true);
  };

  const selectedProvider = selectedProviderId
    ? (providers.find((p) => p.id === selectedProviderId) ?? null)
    : null;

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) {
      resetWizard();
    }
    onOpenChange(next);
  };

  useEffect(() => {
    if (open) return;
    resetWizard();
  }, [open, resetWizard]);

  const handleBack = () => {
    if (stage === "whatsapp-qr") {
      if (qrPollRef.current) {
        clearInterval(qrPollRef.current);
        qrPollRef.current = null;
      }
      setStage("whatsapp-config");
      return;
    }
    setStage("list");
    setSelectedProviderId(null);
    setWaDisplayName("WhatsApp");
    setWaExternalId("");
    setWaExternalTouched(false);
    setWhatsappExternalId("");
    setIsWhatsAppSubmitting(false);
    setQrCodeUrl("");
    setQrLoading(false);
  };

  const handleCopyExternalId = async () => {
    const value = whatsappExternalId || slugify(waExternalId) || waExternalId;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "External ID copied", description: value });
    } catch (error) {
      console.error("Failed to copy external ID", error);
    }
  };

  const sluggedExternalId = slugify(waExternalId);
  const existingWaAccount = waAccounts.find((a) => a.externalId === sluggedExternalId);
  const waExternalIdValid = /^[a-z0-9]([a-z0-9_-]{1,28}[a-z0-9])?$/.test(sluggedExternalId);
  const waAllowedReconnect = !!existingWaAccount && existingWaAccount.status !== "connected";
  const canContinueWhatsApp = waExternalIdValid && (!existingWaAccount || waAllowedReconnect);
  const stepLabels = ["Choose provider", "Set up", "Finish"];
  const currentStepIndex = (() => {
    switch (stage) {
      case "list":
        return 0;
      case "whatsapp-config":
      case "instagram":
        return 1;
      case "whatsapp-qr":
        return 2;
      default:
        return 0;
    }
  })();
  const isListStage = stage === "list";
  const displayedExternalId = whatsappExternalId || sluggedExternalId || waExternalId || "";
  const externalIdBadge = (() => {
    if (!sluggedExternalId || !waExternalIdValid) {
      return { label: "Invalid", variant: "secondary" } as const;
    }
    if (!existingWaAccount) {
      return { label: "Available" } as const;
    }
    return existingWaAccount.status === "connected"
      ? ({ label: "Taken", variant: "destructive" } as const)
      : ({ label: "Reconnect", variant: "secondary" } as const);
  })();
  const externalIdHelperText = "Examples: sales_line_1, support_gh, whatsapp_line_2";

  return (
    <>
      <Dialog onOpenChange={handleDialogOpenChange} open={open}>
        <WizardShell
          indicator={<StepIndicator currentIndex={currentStepIndex} labels={stepLabels} />}
          showBack={!isListStage}
          onBack={handleBack}
          title={
            isListStage
              ? "Connect channel"
              : selectedProvider
                ? `Set up ${selectedProvider.name}`
                : "Set up channel"
          }
          description={
            isListStage
              ? "We support multiple providers. If you can’t find yours, start with WhatsApp Baileys."
              : selectedProvider?.description ?? "Follow the steps to finish connecting."
          }
        >
            {stage === "list" && (
              <ProviderSelectionStep
                onLearnMore={openDetails}
                onQueryChange={(value) => setQuery(value)}
                providers={filtered}
                query={query}
              />
            )}

            {stage === "whatsapp-config" && (
              <WhatsAppConfigStep
                allowedReconnect={waAllowedReconnect}
                badge={externalIdBadge}
                canContinue={canContinueWhatsApp}
                displayName={waDisplayName}
                externalId={waExternalId}
                helperText={externalIdHelperText}
                isSubmitting={isWhatsAppSubmitting}
                onCancel={handleBack}
                onDisplayNameChange={handleDisplayNameChange}
                onExternalIdChange={handleExternalIdChange}
                onSubmit={startBaileysInstall}
              />
            )}

            {stage === "whatsapp-qr" && (
              <WhatsAppQrStep
                displayedExternalId={displayedExternalId}
                onClose={handleCloseWizard}
                onCopyExternalId={handleCopyExternalId}
                onRefresh={() => fetchQr(false)}
                qrCodeUrl={qrCodeUrl}
                qrLoading={qrLoading}
              />
            )}

            {stage === "instagram" && (
              <InstagramStep
                instagramConnecting={instagramConnecting}
                onConnect={handleInstagramConnect}
                onFinish={handleInstagramFinished}
              />
            )}
        </WizardShell>
      </Dialog>
      {detailsChannel && (
        <ChannelDetailsSheet
          channel={detailsChannel}
          onDisconnect={() => setDetailsOpen(false)}
          onInstall={() => {
            if (detailsChannel?.id === "whatsapp-baileys") {
              setDetailsOpen(false);
              beginWhatsAppSetup();
            } else if (detailsChannel?.id === "instagram") {
              setDetailsOpen(false);
              beginInstagramFlow();
            } else {
              setDetailsOpen(false);
            }
          }}
          onOpenChange={setDetailsOpen}
          open={detailsOpen}
        />
      )}
    </>
  );
}
