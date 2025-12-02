"use client";

import { MdMail, MdOpenInFull, MdCloseFullscreen, MdFormatQuote, MdSend } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ComposerTopPanelProps = {
  showPrivate: boolean;
  onModeChange: (mode: "public" | "private") => void;
  onToggleCc: () => void;
  ccActive: boolean;
  onToggleQuoted: () => void;
  quotedActive: boolean;
  signatureEnabled: boolean;
  onSignatureChange: (enabled: boolean) => void;
  signatures: Array<{ id: string; label: string }>;
  selectedSignatureId: string | null;
  onSelectSignature: (id: string | null) => void;
  onOpenSignatureManager: () => void;
  isPopout: boolean;
  onTogglePopout: () => void;
  showSubjectField?: boolean;
  subject?: string;
  onSubjectChange?: (value: string) => void;
};

export function ComposerTopPanel({
  showPrivate,
  onModeChange,
  onToggleCc,
  ccActive,
  onToggleQuoted,
  quotedActive,
  signatureEnabled,
  onSignatureChange,
  signatures,
  selectedSignatureId,
  onSelectSignature,
  onOpenSignatureManager,
  isPopout,
  onTogglePopout,
  showSubjectField,
  subject,
  onSubjectChange,
}: ComposerTopPanelProps) {
  return (
    <div className="flex flex-col gap-3 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          className="bg-muted/60 p-1 rounded-full"
          onValueChange={(value) => {
            if (value === "private") onModeChange("private");
            if (value === "public") onModeChange("public");
          }}
          type="single"
          value={showPrivate ? "private" : "public"}
        >
          <ToggleGroupItem aria-label="Public reply" value="public" className="rounded-full">
            <MdSend className="mr-2 h-4 w-4" /> Public reply
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Private note" value="private" className="rounded-full">
            <MdFormatQuote className="mr-2 h-4 w-4" /> Private note
          </ToggleGroupItem>
        </ToggleGroup>

        <Button onClick={onTogglePopout} size="icon" variant="ghost">
          {isPopout ? <MdCloseFullscreen className="h-4 w-4" /> : <MdOpenInFull className="h-4 w-4" />}
        </Button>
      </div>

      {showSubjectField ? (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Subject
          </span>
          <Input
            className="h-9 text-sm"
            onChange={(event) => onSubjectChange?.(event.target.value)}
            placeholder="Add a subject"
            value={subject ?? ""}
          />
        </div>
      ) : null}

      {showSubjectField ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onToggleCc} size="sm" variant={ccActive ? "default" : "ghost"}>
              <MdMail className="mr-2 h-3.5 w-3.5" /> CC / BCC
            </Button>
            <Button onClick={onToggleQuoted} size="sm" variant={quotedActive ? "default" : "ghost"}>
              <MdFormatQuote className="mr-2 h-3.5 w-3.5" /> Quoted email
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Signature</span>
              <Switch checked={signatureEnabled} onCheckedChange={onSignatureChange} />
            </div>
            {signatureEnabled && (
              <div className="flex items-center gap-2">
                <Select
                  onValueChange={(value) => onSelectSignature(value || null)}
                  value={selectedSignatureId ?? undefined}
                >
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue placeholder="Select signature" />
                  </SelectTrigger>
                  <SelectContent>
                    {signatures.map((sig) => (
                      <SelectItem key={sig.id} value={sig.id}>
                        {sig.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={onOpenSignatureManager} size="sm" variant="outline">
                  Manage
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
