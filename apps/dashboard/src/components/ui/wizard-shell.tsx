"use client";

import { ChevronLeft } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type WizardShellProps = {
  indicator?: React.ReactNode;
  title?: string;
  description?: string;
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  hideClose?: boolean;
};

export function WizardShell({
  indicator,
  title,
  description,
  showBack,
  onBack,
  children,
  className,
  bodyClassName,
  hideClose,
}: WizardShellProps) {
  return (
    <DialogContent
      // Ensure consistent width across steps; override base max-w-xl
      className={cn(
        "max-w-none w-[90vw] sm:w-[48rem]",
        className,
      )}
      hideClose={hideClose}
    >
      <div className="space-y-5 p-4">
        {indicator}

        {(title || description || showBack) && (
          <DialogHeader>
            <div className="flex items-start gap-3">
              {showBack && (
                <Button aria-label="Back" onClick={onBack} size="icon" variant="ghost">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex flex-col gap-1">
                {title ? <DialogTitle>{title}</DialogTitle> : null}
                {description ? (
                  <DialogDescription>{description}</DialogDescription>
                ) : null}
              </div>
            </div>
          </DialogHeader>
        )}

        <div className={cn("min-h-[560px]", bodyClassName)}>{children}</div>
      </div>
    </DialogContent>
  );
}
