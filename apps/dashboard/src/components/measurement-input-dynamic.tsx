"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DynamicMeasurementInputProps = {
  measurements: Record<string, string>;
  onChange: (measurements: Record<string, string>) => void;
  className?: string;
};

export function DynamicMeasurementInput({
  measurements,
  onChange,
  className,
}: DynamicMeasurementInputProps) {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customKey, setCustomKey] = useState("");

  // Convert measurements object to array for rendering
  const entries = Object.entries(measurements);

  const handleUpdateMeasurement = (key: string, value: string) => {
    onChange({
      ...measurements,
      [key]: value,
    });
  };

  const handleRemoveMeasurement = (key: string) => {
    const updated = { ...measurements };
    delete updated[key];
    onChange(updated);
  };

  const handleAddCustom = () => {
    if (!customKey.trim()) return;
    const key = customKey.trim(); // Keep original casing or normalize if needed
    if (!measurements[key]) {
      onChange({
        ...measurements,
        [key]: "",
      });
    }
    setCustomKey("");
    setIsAddingCustom(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Measurements Grid */}
      {entries.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {entries.map(([key, value]) => (
            <div className="group relative space-y-1.5" key={key}>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {key.replace(/_/g, " ")}
                </Label>
                <button
                  onClick={() => handleRemoveMeasurement(key)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <Input
                className="h-9 font-mono text-sm"
                onChange={(e) => handleUpdateMeasurement(key, e.target.value)}
                placeholder="0.0"
                value={value}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center border border-dashed rounded-sm">
          <p className="text-sm text-muted-foreground">No measurements added</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Select from quick add above or add custom
          </p>
        </div>
      )}

      {/* Add Custom Toggle */}
      {!isAddingCustom ? (
        <Button
          onClick={() => setIsAddingCustom(true)}
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          type="button"
        >
          <Plus className="mr-1.5 h-3 w-3" />
          Add Custom Field
        </Button>
      ) : (
        <div className="flex items-end gap-2 pt-2 animate-in fade-in slide-in-from-top-1">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Custom Measurement Name</Label>
            <Input
              autoFocus
              className="h-8"
              onChange={(e) => setCustomKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustom();
                }
                if (e.key === "Escape") {
                  setIsAddingCustom(false);
                }
              }}
              placeholder="e.g. Inseam"
              value={customKey}
            />
          </div>
          <div className="flex gap-1">
            <Button onClick={handleAddCustom} size="sm" className="h-8" type="button">
              Add
            </Button>
            <Button
              onClick={() => setIsAddingCustom(false)}
              size="sm"
              variant="ghost"
              className="h-8"
              type="button"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
