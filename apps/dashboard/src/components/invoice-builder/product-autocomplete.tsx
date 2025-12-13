"use client";

import { cn } from "@midday/ui/cn";
import { useState } from "react";

type Props = {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onProductSelect?: (product: unknown) => void;
  disabled?: boolean;
};

export function ProductAutocomplete({ value, onChange, disabled = false }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(event) => onChange(event.target.value)}
      placeholder={isFocused && !value ? "Enter product..." : ""}
      className={cn(
        "border-0 p-0 min-h-6 border-b border-transparent focus:border-border font-mono text-xs pt-1",
        "transition-colors duration-200 bg-transparent outline-none resize-none w-full",
        "text-primary leading-[18px]",
        !value && !isFocused &&
          "bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]",
      )}
    />
  );
}
