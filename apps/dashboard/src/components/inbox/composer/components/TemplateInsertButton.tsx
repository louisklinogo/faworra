"use client";

import { useState } from "react";
import { MdDescription } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ComposerTemplateDialog } from "./ComposerTemplateDialog";

type TemplateInsertButtonProps = {
  provider?: string | null;
  disabled?: boolean;
  onInsert: (content: string) => void;
};

export function TemplateInsertButton({ provider, disabled, onInsert }: TemplateInsertButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            disabled={disabled}
            onClick={() => setOpen(true)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <MdDescription className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Templates</p>
        </TooltipContent>
      </Tooltip>
      <ComposerTemplateDialog
        disabled={disabled}
        onInsertTemplate={onInsert}
        onOpenChange={setOpen}
        open={open}
        provider={provider}
      />
    </>
  );
}
