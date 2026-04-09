"use client";

import { Button } from "@faworra-new/ui/components/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@faworra-new/ui/components/popover";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Portal } from "@/components/portal";

interface ExportBarProps {
	/** Callback after export completes */
	onExportComplete?: () => void;
	/** IDs of transactions to export */
	transactionIds: string[];
}

export function ExportBar({
	transactionIds,
	onExportComplete,
}: ExportBarProps) {
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

			if (!response.ok) {
				throw new Error("Export failed");
			}

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

	if (count === 0) {
		return null;
	}

	return (
		<Portal>
			<AnimatePresence>
				<motion.div
					animate={{ y: 0 }}
					className="pointer-events-none fixed right-0 bottom-6 left-0 z-50 flex h-12 justify-center"
					exit={{ y: 100 }}
					initial={{ y: 100 }}
					transition={{ duration: 0.2, ease: "easeOut" }}
				>
					<div className="pointer-events-auto relative h-12 min-w-[400px]">
						{/* Blur layer */}
						<motion.div
							animate={{ opacity: 1 }}
							className="absolute inset-0 bg-[rgba(247,247,247,0.85)] backdrop-blur-lg backdrop-filter dark:bg-[rgba(19,19,19,0.7)]"
							initial={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
						/>
						<div className="relative flex h-12 items-center justify-between pr-2 pl-4">
							<span className="text-sm">
								{count} transaction{count !== 1 ? "s" : ""} ready to export
							</span>

							<div className="flex items-center space-x-2">
								{/* Export dropdown */}
								<Popover>
									<PopoverTrigger asChild>
										<Button disabled={isExporting} size="sm" variant="default">
											<Download className="mr-1 h-4 w-4" />
											Export
										</Button>
									</PopoverTrigger>
									<PopoverContent align="end" className="w-48 p-2">
										<div className="space-y-1">
											<Button
												className="w-full justify-start"
												disabled={isExporting}
												onClick={exportToCsv}
												size="sm"
												variant="ghost"
											>
												<Download className="mr-2 h-4 w-4" />
												Export as CSV
											</Button>
											<Button
												className="w-full justify-start"
												disabled={isExporting}
												onClick={exportToExcel}
												size="sm"
												variant="ghost"
											>
												<FileSpreadsheet className="mr-2 h-4 w-4" />
												Export as Excel
											</Button>
										</div>
									</PopoverContent>
								</Popover>

								{/* Mark as Posted */}
								<Button disabled={isExporting} size="sm" variant="outline">
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
