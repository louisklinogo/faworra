"use client";

import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  placeholder?: string;
  className?: string;
};

export function SearchInline({ placeholder = "Search…", className }: Props) {
  const [q, setQ] = useQueryState("q", { defaultValue: "" });
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(q || "");
      inputRef.current?.focus();
    }
  }, [open, q]);

  // Auto-commit with debounce
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => setQ(value || ""), 250);
    return () => clearTimeout(id);
  }, [value, open, setQ]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {open ? (
        <div className="flex items-center gap-2 transition-all">
          <div className="relative">
            <Icons.Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-[0px] pl-9 transition-[width] duration-200 sm:w-[300px]"
              onBlur={() => setQ(value || "")}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder={placeholder}
              ref={inputRef}
              value={value}
            />
          </div>
          <Button
            aria-label={value ? "Clear search" : "Close search"}
            onClick={() => {
              if (value) setValue("");
              else setOpen(false);
            }}
            size="icon"
            variant="ghost"
          >
            <Icons.Close className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button aria-label="Search" onClick={() => setOpen(true)} size="icon" variant="ghost">
          <Icons.Search className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
