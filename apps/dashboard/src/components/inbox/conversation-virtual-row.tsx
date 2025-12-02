"use client";

import { memo, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import type {
  VirtualItem,
  Virtualizer,
} from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

type ConversationVirtualRowProps = {
  virtualRow: VirtualItem;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  dependencies?: ReadonlyArray<unknown>;
  className?: string;
  children: ReactNode;
};

const ConversationVirtualRow = memo(function ConversationVirtualRow({
  virtualRow,
  virtualizer,
  dependencies = [],
  className,
  children,
}: ConversationVirtualRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const node = rowRef.current;
    if (!node) return;
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      virtualizer.measureElement(node);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [virtualizer]);

  useLayoutEffect(() => {
    const node = rowRef.current;
    if (!node) return;
    virtualizer.measureElement(node);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualizer, ...dependencies]);

  return (
    <div
      ref={rowRef}
      data-index={virtualRow.index}
      className={cn("absolute inset-x-0 top-0 w-full", className)}
      style={{
        // Use absolute top positioning (snapped to integer) to avoid
        // sub-pixel translateY text blurring on Windows/Chromium.
        top: `${Math.round(virtualRow.start) + 12}px`,
        // Do NOT force a fixed height when using measureElement; let
        // the row grow naturally so the virtualizer can measure it.
      }}
    >
      {children}
    </div>
  );
});

export { ConversationVirtualRow };
