"use client";

import { Copy, Loader2 } from "lucide-react";
import Image from "next/image";
import type { ComponentProps } from "react";
import { MdOutlineInfo } from "react-icons/md";
import { RiInstagramFill, RiWhatsappFill } from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConnectChannelProvider } from "./connect-channel-provider";
import type { Provider } from "./connect-channels-types";


type ProviderSelectionStepProps = {
  providers: Provider[];
  query: string;
  onQueryChange: (value: string) => void;
  onLearnMore: (provider: Provider) => void;
};

export function ProviderSelectionStep({
  providers,
  query,
  onQueryChange,
  onLearnMore,
}: ProviderSelectionStepProps) {
  return (
    <div className="space-y-4">
      <Input
        autoComplete="off"
        autoCorrect="off"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search provider..."
        spellCheck={false}
        type="search"
        value={query}
      />
      <div className="scrollbar-hide min-h-[430px] max-h-[430px] space-y-4 overflow-auto pt-2">
        {providers.map(({ id, name, description, Logo, onSelect, disabled, iconSize }) => (
          <div className="flex justify-between" key={id}>
            <div className="flex items-center">
              <span className="inline-flex h-6 w-6 items-center justify-center text-foreground/80">
                <Logo size={iconSize ?? 20} />
              </span>
              <div className="ml-4 cursor-default space-y-1">
                <p className="font-medium text-sm leading-none">{name}</p>
                <span className="text-[#878787] text-xs">{description}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ConnectChannelProvider
                disabled={disabled}
                id={id}
                openInstagram={() => onSelect?.()}
                openWhatsApp={() => onSelect?.()}
                provider={id as never}
              />

              <TooltipProvider delayDuration={70}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-7 w-7 rounded-full"
                      onClick={() =>
                        onLearnMore({
                          id,
                          name,
                          description,
                          Logo,
                          onSelect,
                          disabled,
                          iconSize,
                        })
                      }
                      size="icon"
                      variant="outline"
                    >
                      <MdOutlineInfo size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={10}>
                    Learn more
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}

        {providers.length === 0 && (
          <div className="flex min-h-[430px] flex-col items-center justify-center">
            <p className="mb-2 font-medium">No providers found</p>
            <p className="text-center text-[#878787] text-sm">
              We couldn't find a provider matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

type BadgeState = {
  label: string;
  variant?: ComponentProps<typeof Badge>["variant"];
};

type WhatsAppConfigStepProps = {
  displayName: string;
  externalId: string;
  onDisplayNameChange: (value: string) => void;
  onExternalIdChange: (value: string) => void;
  badge: BadgeState;
  helperText: string;
  onCancel: () => void;
  onSubmit: () => void;
  canContinue: boolean;
  isSubmitting: boolean;
  allowedReconnect: boolean;
};

export function WhatsAppConfigStep({
  displayName,
  externalId,
  onDisplayNameChange,
  onExternalIdChange,
  badge,
  helperText,
  onCancel,
  onSubmit,
  canContinue,
  isSubmitting,
  allowedReconnect,
}: WhatsAppConfigStepProps) {
  const badgeTone = (() => {
    if (badge.variant === "destructive") return "bg-destructive text-destructive-foreground";
    if (badge.variant === "secondary") return "bg-secondary text-secondary-foreground";
    return "bg-emerald-600 text-white";
  })();

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Input
          onChange={(event) => onDisplayNameChange(event.target.value)}
          placeholder="Display name (e.g., Store Line 1)"
          value={displayName}
        />
        <div className="text-muted-foreground text-[11px]">Shown in Inbox and Settings</div>
      </div>
      <div className="space-y-1.5">
        <div className="relative">
          <Input
            className="pr-16"
            onChange={(event) => onExternalIdChange(event.target.value)}
            placeholder="External ID (e.g., store_line_1)"
            value={externalId}
          />
          <Badge
            className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium ${badgeTone}`}
            variant={badge.variant}
          >
            {badge.label}
          </Badge>
        </div>
        <div className="text-muted-foreground text-[11px]">
          Unique ID used for pairing and QR. Lowercase, numbers, dash or underscore.
        </div>
        <div className="text-muted-foreground text-[11px]">{helperText}</div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={!canContinue || isSubmitting} onClick={onSubmit}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Please wait
            </span>
          ) : allowedReconnect ? (
            "Reconnect"
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}

type WhatsAppQrStepProps = {
  qrCodeUrl: string;
  qrLoading: boolean;
  onRefresh: () => void;
  onCopyExternalId: () => void;
  displayedExternalId: string;
  onClose: () => void;
};

export function WhatsAppQrStep({
  qrCodeUrl,
  qrLoading,
  onRefresh,
  onCopyExternalId,
  displayedExternalId,
  onClose,
}: WhatsAppQrStepProps) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[360px,1fr]">
      <div>
        <div className="relative flex items-center justify-center rounded-lg border p-4">
          <div className="flex h-[360px] w-[360px] items-center justify-center rounded-md border border-border bg-background">
            {qrLoading && !qrCodeUrl ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
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
          <Button className="flex-1 gap-2" disabled={qrLoading} onClick={onRefresh}>
            {qrLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RiWhatsappFill size={16} />
            )}
            {qrLoading ? "Refreshing…" : "Refresh QR"}
          </Button>
          <Button
            className="flex-1"
            disabled={!displayedExternalId}
            onClick={onCopyExternalId}
            variant="outline"
          >
            <Copy className="mr-2 h-4 w-4" />
            {displayedExternalId ? `Copy ${displayedExternalId}` : "Copy ID"}
          </Button>
        </div>
        <p className="mt-2 whitespace-nowrap text-[11px] text-muted-foreground">
          WhatsApp → Linked devices → Link a device
        </p>
      </div>
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
          <h4 className="mb-2 font-medium text-sm">Tips</h4>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground text-xs">
            <li>Keep your phone powered and online for a steady connection.</li>
            <li>If the session pauses, re-scan — it takes under a minute.</li>
          </ul>
        </div>
        <Button className="mt-2" onClick={onClose} size="sm" variant="ghost">
          Close
        </Button>
      </div>
    </div>
  );
}

type InstagramStepProps = {
  instagramConnecting: boolean;
  onConnect: () => void;
  onFinish: () => void;
};

export function InstagramStep({ instagramConnecting, onConnect, onFinish }: InstagramStepProps) {
  return (
    <div className="flex flex-col items-center space-y-6 py-6">
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
      <div className="flex w-full flex-col gap-3">
        <Button disabled={instagramConnecting} onClick={onConnect}>
          {instagramConnecting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting OAuth…
            </span>
          ) : (
            "Connect with Instagram"
          )}
        </Button>
        <Button onClick={onFinish} variant="outline">
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
  );
}
