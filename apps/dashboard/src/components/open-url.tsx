"use client";

import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function OpenURL({ href, children, className }: Props) {
  const handleOnClick = () => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <span onClick={handleOnClick} className={cn("cursor-pointer", className)}>
      {children}
    </span>
  );
}
