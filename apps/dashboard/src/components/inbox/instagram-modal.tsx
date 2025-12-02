"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { RiInstagramFill } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface InstagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstagramModal({ isOpen, onClose }: InstagramModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const handleConnect = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    fetch(`${base}/providers/instagram/oauth/start`, { method: "POST" })
      .then(async (r) => {
        if (!r.ok) throw new Error("failed to start oauth");
        const j = (await r.json()) as { url: string };
        if (j?.url) {
          const w = window.open(j.url, "_blank");
          if (!w) {
            toast({
              title: "Popup blocked",
              description: "Allow popups or open the link from the address bar.",
            });
          }
        }
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Failed to start Instagram OAuth";
        toast({ title: "Couldn’t start Instagram connect", description: msg });
      });
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Instagram</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 p-8 pt-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <RiInstagramFill className="size-8" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-lg">Connect Instagram</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Link your Instagram Business account to receive direct messages
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 border-t-[1px] pt-8">
            <Button className="w-full" onClick={handleConnect} variant="default">
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect with Instagram
            </Button>
            <Button
              className="w-full"
              onClick={() => {
                onClose();
                router.refresh();
              }}
              variant="outline"
            >
              I finished connecting — Refresh
            </Button>
          </div>

          <div className="max-w-sm text-center text-muted-foreground text-xs">
            <ol className="mt-1 list-inside list-decimal space-y-1">
              <li>You'll be redirected to Facebook for authorization</li>
              <li>Select your Instagram Business account</li>
              <li>Grant permissions to receive direct messages</li>
              <li>Messages will appear in your inbox dashboard</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
