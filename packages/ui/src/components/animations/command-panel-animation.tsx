"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
	MdOutlineArrowDownward,
	MdOutlineArrowOutward,
	MdOutlineArrowUpward,
	MdOutlineDescription,
	MdOutlineListAlt,
	MdOutlinePictureAsPdf,
	MdOutlineReceipt,
	MdOutlineSubdirectoryArrowLeft,
	MdSearch,
} from "react-icons/md";
import { Icons } from "../icons";

export function CommandPanelAnimation({
	onComplete,
	shouldPlay = true,
}: {
	onComplete?: () => void;
	shouldPlay?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [_searchQuery, _setSearchQuery] = useState("");
	const [showResults, setShowResults] = useState(false);
	const [showTransaction, setShowTransaction] = useState(false);
	const [showInvoice, setShowInvoice] = useState(false);
	const [showReceipts, setShowReceipts] = useState(false);
	const [showFiles, setShowFiles] = useState(false);

	const transactionSearch = "Acme";
	const [displayedQuery, setDisplayedQuery] = useState("");

	const transaction = {
		id: 1,
		name: "Acme Corporation",
		amount: "$3,500.00",
		date: "Jan 15, 2025",
	};

	const invoices = [
		{
			id: 1,
			name: "Invoice #INV-2025-001",
			amount: "$3,500.00",
			date: "Jan 15, 2025",
		},
		{
			id: 2,
			name: "Invoice #INV-2024-089",
			amount: "$2,200.00",
			date: "Dec 20, 2024",
		},
	];

	const receipts = [
		{
			id: 1,
			name: "Receipt - Acme Services",
			amount: "$450.00",
			date: "Jan 10, 2025",
		},
		{
			id: 2,
			name: "Receipt - Acme Subscription",
			amount: "$299.00",
			date: "Jan 5, 2025",
		},
	];

	const files = [
		{
			id: 1,
			name: "Acme_Contract_Q1_2025.pdf",
		},
		{
			id: 2,
			name: "Invoice_Acme_2025-001.pdf",
		},
		{
			id: 3,
			name: "Receipt_Office_Supplies_Jan_2025.pdf",
		},
		{
			id: 4,
			name: "Acme_Payment_Confirmation.pdf",
		},
	];

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		let charIndex = 0;
		const typingInterval = setInterval(() => {
			if (charIndex < transactionSearch.length) {
				setDisplayedQuery(transactionSearch.slice(0, charIndex + 1));
				charIndex++;
			} else {
				clearInterval(typingInterval);
				setTimeout(() => {
					setShowResults(true);
					setTimeout(() => {
						setShowTransaction(true);
						setTimeout(() => {
							setShowInvoice(true);
							setTimeout(() => {
								setShowReceipts(true);
								setTimeout(() => {
									setShowFiles(true);
								}, 100);
							}, 100);
						}, 100);
					}, 200);
				}, 400);
			}
		}, 80);

		const doneTimer = onComplete
			? setTimeout(() => {
					onComplete();
				}, 12_000)
			: undefined;

		return () => {
			clearInterval(typingInterval);
			if (doneTimer) {
				clearTimeout(doneTimer);
			}
		};
	}, [shouldPlay, onComplete, transactionSearch]);

	return (
		<div
			className="flex h-full w-full items-center justify-center p-2 md:p-3"
			ref={containerRef}
		>
			{/* Command Panel Container */}
			<div className="relative flex h-full max-h-[500px] w-full max-w-[400px] flex-col border border-border bg-background">
				{/* Search Bar */}
				<div className="flex items-center border-border border-b pt-1 pb-1.5 md:pt-2 md:pb-2">
					<div className="relative w-full">
						<input
							className="w-full rounded-none bg-background px-2 py-1 pr-7 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none md:px-3 md:py-1.5 md:pr-8 md:text-[12px]"
							placeholder="Type a command or search..."
							readOnly
							type="text"
							value={displayedQuery}
						/>
						<MdSearch
							className="absolute top-1/2 right-2 -translate-y-1/2 transform text-muted-foreground md:right-3"
							size={14}
						/>
					</div>
				</div>

				{/* Content Area */}
				<div className="flex-1 overflow-hidden px-2 py-2 md:px-3 md:py-3">
					{showResults && (
						<>
							{/* Transaction Section */}
							{showTransaction && (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="mb-3 md:mb-4"
									initial={{ opacity: 0, y: 10 }}
									transition={{ duration: 0.3, ease: "easeOut" }}
								>
									<div className="mb-1.5 px-1 text-[10px] text-muted-foreground uppercase tracking-wider md:mb-2 md:text-[11px]">
										Transaction
									</div>
									<motion.div
										animate={{ opacity: 1, y: 0 }}
										className="flex cursor-pointer items-center gap-2 py-1 pr-2 transition-colors hover:bg-muted md:gap-3 md:py-1.5 md:pr-3"
										initial={{ opacity: 0, y: 10 }}
										transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
									>
										<MdOutlineListAlt
											className="flex-shrink-0 text-muted-foreground"
											size={16}
										/>
										<div className="min-w-0 flex-1">
											<div className="text-[11px] text-foreground md:text-[12px]">
												{transaction.name}
											</div>
										</div>
									</motion.div>
								</motion.div>
							)}

							{/* Invoice Section */}
							{showInvoice && (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="mb-3 md:mb-4"
									initial={{ opacity: 0, y: 10 }}
									transition={{ duration: 0.3, ease: "easeOut" }}
								>
									<div className="mb-1.5 px-1 text-[10px] text-muted-foreground uppercase tracking-wider md:mb-2 md:text-[11px]">
										Invoice
									</div>
									<div className="space-y-0.5">
										{invoices.map((invoice, index) => (
											<motion.div
												animate={{ opacity: 1, y: 0 }}
												className="flex cursor-pointer items-center gap-2 py-1 pr-2 transition-colors hover:bg-muted md:gap-3 md:py-1.5 md:pr-3"
												initial={{ opacity: 0, y: 10 }}
												key={invoice.id}
												transition={{
													duration: 0.3,
													delay: index * 0.08,
													ease: "easeOut",
												}}
											>
												<MdOutlineDescription
													className="flex-shrink-0 text-muted-foreground"
													size={16}
												/>
												<div className="min-w-0 flex-1">
													<div className="text-[11px] text-foreground md:text-[12px]">
														{invoice.name}
													</div>
												</div>
											</motion.div>
										))}
									</div>
								</motion.div>
							)}

							{/* Receipts Section */}
							{showReceipts && (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="mb-3 md:mb-4"
									initial={{ opacity: 0, y: 10 }}
									transition={{ duration: 0.3, ease: "easeOut" }}
								>
									<div className="mb-1.5 px-1 text-[10px] text-muted-foreground uppercase tracking-wider md:mb-2 md:text-[11px]">
										Receipt
									</div>
									<div className="space-y-0.5">
										{receipts.map((receipt, index) => (
											<motion.div
												animate={{ opacity: 1, y: 0 }}
												className="flex cursor-pointer items-center gap-2 py-1 pr-2 transition-colors hover:bg-muted md:gap-3 md:py-1.5 md:pr-3"
												initial={{ opacity: 0, y: 10 }}
												key={receipt.id}
												transition={{
													duration: 0.3,
													delay: index * 0.08,
													ease: "easeOut",
												}}
											>
												<MdOutlineReceipt
													className="flex-shrink-0 text-muted-foreground"
													size={16}
												/>
												<div className="min-w-0 flex-1">
													<div className="text-[11px] text-foreground md:text-[12px]">
														{receipt.name}
													</div>
												</div>
											</motion.div>
										))}
									</div>
								</motion.div>
							)}

							{/* Files Section */}
							{showFiles && (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="mb-3 md:mb-4"
									initial={{ opacity: 0, y: 10 }}
									transition={{ duration: 0.3, ease: "easeOut" }}
								>
									<div className="mb-1.5 px-1 text-[10px] text-muted-foreground uppercase tracking-wider md:mb-2 md:text-[11px]">
										Files
									</div>
									<div className="space-y-0.5">
										{files.map((file, index) => (
											<motion.div
												animate={{ opacity: 1, y: 0 }}
												className="flex cursor-pointer items-center gap-2 py-1 pr-2 transition-colors hover:bg-muted md:gap-3 md:py-1.5 md:pr-3"
												initial={{ opacity: 0, y: 10 }}
												key={file.id}
												transition={{
													duration: 0.3,
													delay: index * 0.08,
													ease: "easeOut",
												}}
											>
												<MdOutlinePictureAsPdf
													className="flex-shrink-0 text-muted-foreground"
													size={16}
												/>
												<div className="min-w-0 flex-1">
													<div className="truncate text-[11px] text-foreground md:text-[12px]">
														{file.name}
													</div>
												</div>
											</motion.div>
										))}
									</div>
									<motion.div
										animate={{ opacity: 1 }}
										className="mt-2 flex cursor-pointer items-center gap-1 py-1 pr-2 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:py-1.5 md:pr-3 md:text-[12px]"
										initial={{ opacity: 0 }}
										transition={{ duration: 0.3, delay: 0.3 }}
									>
										<span>View vault</span>
										<MdOutlineArrowOutward
											className="text-muted-foreground"
											size={12}
										/>
									</motion.div>
								</motion.div>
							)}
						</>
					)}
				</div>

				{/* Navigation Controls */}
				<motion.div
					animate={{ opacity: 1 }}
					className="flex items-center justify-between border-border border-t px-2 py-1.5 md:px-3 md:py-2"
					initial={{ opacity: 0 }}
					transition={{ duration: 0.3, delay: 1 }}
				>
					<div className="flex items-center">
						<Icons.LogoSmall className="h-4 w-4 text-muted-foreground" />
					</div>
					<div className="flex items-center gap-1">
						<button
							className="flex h-5 w-5 items-center justify-center bg-muted transition-colors hover:bg-muted/80"
							type="button"
						>
							<MdOutlineArrowUpward
								className="text-muted-foreground"
								size={12}
							/>
						</button>
						<button
							className="flex h-5 w-5 items-center justify-center bg-muted transition-colors hover:bg-muted/80"
							type="button"
						>
							<MdOutlineArrowDownward
								className="text-muted-foreground"
								size={12}
							/>
						</button>
						<button
							className="flex h-5 w-5 items-center justify-center bg-muted transition-colors hover:bg-muted/80"
							type="button"
						>
							<MdOutlineSubdirectoryArrowLeft
								className="text-muted-foreground"
								size={12}
							/>
						</button>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
