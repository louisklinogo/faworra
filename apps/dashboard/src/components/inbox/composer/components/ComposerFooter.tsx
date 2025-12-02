"use client";

import { MdSend } from "react-icons/md";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ComposerToolbar, type ComposerToolbarProps } from "./ComposerToolbar";

type ComposerFooterProps = {
  toolbarProps: ComposerToolbarProps;
  onSend: () => void;
  sendDisabled: boolean;
  sendKey: "enter" | "mod+enter";
};

export function ComposerFooter({ toolbarProps, onSend, sendDisabled, sendKey }: ComposerFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2">
      <ComposerToolbar {...toolbarProps} />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-disabled={sendDisabled}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90",
              sendDisabled && "cursor-not-allowed opacity-60",
            )}
            disabled={sendDisabled}
            onClick={onSend}
            type="button"
          >
            <MdSend className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
            <span className="text-[10px] sm:hidden">Go</span>
            <span className="ml-1 text-[10px] text-primary-foreground/80">
              ({sendKey === "enter" ? "Enter" : "Ctrl/Cmd+Enter"})
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Send ({sendKey === "enter" ? "Enter" : "Ctrl/Cmd+Enter"})</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
