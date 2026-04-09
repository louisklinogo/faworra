"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Icons } from "@faworra-new/ui/components/icons";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Portal } from "@/components/portal";
import { trpc } from "@/utils/trpc";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@faworra-new/ui/components/popover";

interface ExportBarProps {
  /** IDs of transactions to export */
  transactionIds: string[];
  /** Callback after export completes */
  onExportComplete?: () => void;
}

export function ExportBar({ transactionIds, onExportComplete }: ExportBarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const count = transactionIds.length;

  // Export to CSV
  const exportToCsv = async () => {
    setIsExporting(true);
    try {
      // Fetch the transactions
      const response = await fetch("/api/transactions/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: transactionIds, format: "csv" }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onExportComplete?.();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel (placeholder)
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // TODO: Implement Excel export
      console.log("Excel export not yet implemented");
    } finally {
      setIsExporting(false);
    }
  };

  if (count === 0) return null;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          className="h-12 fixed bottom-6 left-0 right-0 pointer-events-none flex justify-center z-50"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="relative pointer-events-auto min-w-[400px] h-12">
            {/* Blur layer */}
            <motion.div
              className="absolute inset-0 backdrop-filter backdrop-blur-lg bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            />
            <div className="relative h-12 justify-between items-center flex pl-4 pr-2">
              <span className="text-sm">
                {count} transaction{count !== 1 ? "s" : ""} ready to export
              </span>

              <div className="flex items-center space-x-2">
                {/* Export dropdown */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        size="sm"
                        onClick={exportToCsv}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        size="sm"
                        onClick={exportToExcel}
                        disabled={isExporting}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export as Excel
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Mark as Posted */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                >
                  Mark as Posted
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
