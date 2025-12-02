"use client";

import { createBrowserClient } from "@Faworra/supabase/client";
import { Copy } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiWhatsappFill } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalId: string;
  onConnected?: () => void;
}

export function WhatsAppModal({ isOpen, onClose, externalId, onConnected }: WhatsAppModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const failureRef = useRef(0);
  const router = useRouter();
  const { toast } = useToast();

  const supabase = useMemo(() => createBrowserClient(), []);

  const fetchQr = useCallback(async () => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${base}/providers/whatsapp/baileys/session/qr?externalId=${encodeURIComponent(externalId)}`,
        {
          cache: "no-store",
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        },
      );
      const json = await res.json();
      if (json?.status === "connected") {
        // Auto-close when connected
        toast({ title: "WhatsApp connected", description: "Your WhatsApp line is now active." });
        onClose();
        if (onConnected) onConnected();
        else router.refresh();
        return;
      }
      if (json?.qr) {
        const dataUrl = await QRCode.toDataURL(json.qr, { width: 256, margin: 2 });
        setQrCodeUrl(dataUrl);
        failureRef.current = 0;
      }
    } catch (_e) {
      failureRef.current += 1;
      if (failureRef.current % 3 === 0) {
        toast({
          title: "Couldn’t load QR",
          description: "We’ll keep retrying. Click Refresh QR to try now.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [externalId, onClose, onConnected, router, supabase, toast]);

  useEffect(() => {
    if (!isOpen) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    // Start polling for QR updates
    fetchQr();
    pollRef.current = setInterval(fetchQr, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, fetchQr]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(externalId);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="p-0 sm:max-w-3xl">
        <DialogHeader className="sticky top-0 z-10 border-b bg-background px-5 pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-lg leading-none md:text-xl">
                Connect WhatsApp
              </DialogTitle>
              <p className="mt-1 text-muted-foreground text-xs">
                Scan the QR with your phone to pair WhatsApp.
              </p>
            </div>
            <Button onClick={onClose} size="sm" variant="ghost">
              Back to providers
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[360px,1fr]">
            {/* Left: QR panel */}
            <div>
              <div className="relative flex items-center justify-center rounded-lg border p-4">
                <div className="flex h-[360px] w-[360px] items-center justify-center rounded-md border border-border bg-background">
                  {loading && !qrCodeUrl ? (
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-foreground border-b-2" />
                    </div>
                  ) : qrCodeUrl ? (
                    <Image
                      alt="WhatsApp QR Code"
                      className="object-contain"
                      height={348}
                      src={qrCodeUrl}
                      width={348}
                    />
                  ) : (
                    <span aria-live="polite" className="text-muted-foreground text-sm">
                      Waiting for QR…
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1 gap-2"
                  disabled={loading}
                  onClick={fetchQr}
                  variant="default"
                >
                  <RiWhatsappFill size={16} />
                  {loading ? "Refreshing…" : "Refresh QR"}
                </Button>
                <Button className="flex-1" onClick={copyToClipboard} variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              </div>

              <p className="mt-2 whitespace-nowrap text-[11px] text-muted-foreground">
                WhatsApp → Linked devices → Link a device
              </p>
            </div>

            {/* Right: Steps & tips */}
            <div className="space-y-6">
              <div>
                <h4 className="mb-2 font-medium text-sm">Steps</h4>
                <ol className="list-inside list-decimal space-y-1 text-muted-foreground text-xs">
                  <li>Open WhatsApp on your phone</li>
                  <li>Go to Linked devices → Link a device</li>
                  <li>Point your camera at the QR</li>
                  <li>Messages will start appearing in your inbox</li>
                </ol>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-sm">Things to know</h4>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground text-xs">
                  <li>Keep your phone powered and online for a steady connection.</li>
                  <li>If the session pauses, re‑scan — it takes under a minute.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
