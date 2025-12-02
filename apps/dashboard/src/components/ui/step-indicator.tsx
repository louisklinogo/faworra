"use client";

import * as React from "react";

type StepIndicatorProps = {
  labels: string[];
  currentIndex: number;
  className?: string;
};

export function StepIndicator({ labels, currentIndex, className }: StepIndicatorProps) {
  return (
    <div className={`flex w-full items-center gap-2 ${className ?? ""}`}>
      {labels.map((label, index) => (
        <div className="flex flex-1 flex-col items-center gap-1" key={label}>
          <div
            className={`h-1 w-full rounded-full ${index <= currentIndex ? "bg-primary" : "bg-muted"}`}
          />
          <span
            className={`text-[11px] ${index <= currentIndex ? "text-foreground" : "text-muted-foreground"}`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
