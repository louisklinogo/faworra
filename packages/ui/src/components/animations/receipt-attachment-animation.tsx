"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MdCheck, MdDeleteOutline, MdOutlineMoreVert } from "react-icons/md";

export function ReceiptAttachmentAnimation({
	shouldPlay = true,
}: {
	shouldPlay?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [showReceipt, setShowReceipt] = useState(false);
	const [showLogo, setShowLogo] = useState(false);
	const [showBar, setShowBar] = useState(false);

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		const receiptTimer = setTimeout(() => {
			setShowReceipt(true);
			setShowLogo(true);
		}, 0);

		const barTimer = setTimeout(() => {
			setShowBar(true);
		}, 1500);

		return () => {
			clearTimeout(receiptTimer);
			clearTimeout(barTimer);
		};
	}, [shouldPlay]);

	return (
		<div
			className="relative h-full w-full overflow-hidden border border-border bg-background"
			ref={containerRef}
		>
			{/* Receipt View */}
			<AnimatePresence>
				{showReceipt && (
					<motion.div
						animate={{ opacity: 1 }}
						className="flex h-full w-full flex-col"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						transition={{ duration: 0.4 }}
					>
						{/* Header */}
						<div className="flex items-center justify-between border-border border-b px-2 py-1.5 md:px-3 md:py-2">
							<div className="flex items-center gap-1.5">
								<MdDeleteOutline className="text-muted-foreground" size={14} />
							</div>
							<div className="flex items-center gap-2">
								<Image
									alt="Gmail"
									className="h-3 w-3 object-contain md:h-3.5 md:w-3.5"
									height={14}
									src="/images/gmail.svg"
									width={14}
								/>
								<MdOutlineMoreVert
									className="text-muted-foreground"
									size={14}
								/>
							</div>
						</div>

						{/* Receipt Content */}
						<div className="flex-1 overflow-hidden p-2 md:p-3">
							<div className="flex h-full flex-col space-y-2 md:space-y-2.5">
								{/* Sender Info */}
								<div className="flex items-start gap-2 md:gap-2.5">
									<motion.div
										animate={{ opacity: showLogo ? 1 : 0 }}
										className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-foreground/5 md:h-7 md:w-7"
										initial={{ opacity: 0 }}
										transition={{ duration: 0.25 }}
									>
										<Image
											alt="Supabase"
											className="h-full w-full object-contain"
											height={16}
											src="/images/supabase.png"
											width={16}
										/>
									</motion.div>
									<div className="min-w-0 flex-1">
										<p className="font-medium font-sans text-[11px] text-foreground md:text-[12px]">
											Supabase
										</p>
										<p className="mt-0.5 font-sans text-[9px] text-muted-foreground md:text-[10px]">
											Receipt-2025-0847.pdf
										</p>
									</div>
								</div>

								{/* Receipt Preview */}
								<div className="flex-1 overflow-hidden border border-border bg-card p-2 md:p-3">
									<div className="flex h-full flex-col space-y-2 md:space-y-2.5">
										{/* Receipt Header */}
										<div className="border-border border-b pb-2 md:pb-2.5">
											<h3 className="mb-0.5 font-medium font-sans text-[11px] text-foreground md:text-[12px]">
												Receipt
											</h3>
											<p className="font-sans text-[9px] text-muted-foreground md:text-[10px]">
												Receipt #RCP-2025-0847
											</p>
										</div>

										{/* Company Info */}
										<div className="space-y-0.5">
											<p className="font-medium font-sans text-[11px] text-foreground md:text-[12px]">
												Supabase Inc.
											</p>
											<p className="font-sans text-[9px] text-muted-foreground md:text-[10px]">
												123 Innovation Drive, Suite 400
											</p>
											<p className="font-sans text-[9px] text-muted-foreground md:text-[10px]">
												San Francisco, CA 94105
											</p>
										</div>

										{/* Receipt Details */}
										<div className="flex-1 space-y-1.5 md:space-y-2">
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0 flex-1">
													<p className="font-sans text-[9px] text-muted-foreground md:text-[10px]">
														Date:
													</p>
													<p className="font-sans text-[11px] text-foreground md:text-[12px]">
														June 15, 2025
													</p>
												</div>
												<div className="flex-shrink-0 text-right">
													<p className="font-sans text-[9px] text-muted-foreground md:text-[10px]">
														Billing Period:
													</p>
													<p className="font-sans text-[11px] text-foreground md:text-[12px]">
														Jun 1 - Jun 30
													</p>
												</div>
											</div>

											{/* Line Items */}
											<div className="mt-1.5 border-border border-t pt-1.5 md:mt-2 md:pt-2">
												<div className="space-y-1.5">
													<div className="flex items-start justify-between gap-2">
														<div className="min-w-0 flex-1">
															<p className="font-medium font-sans text-[11px] text-foreground md:text-[12px]">
																Business Plan - Monthly Subscription
															</p>
															<p className="mt-0.5 font-sans text-[9px] text-muted-foreground md:text-[10px]">
																Cloud storage & sync services
															</p>
														</div>
														<p className="ml-2 flex-shrink-0 font-medium font-sans text-[11px] text-foreground md:text-[12px]">
															$49.00
														</p>
													</div>
												</div>
											</div>

											{/* Totals */}
											<div className="mt-auto space-y-1 border-border border-t pt-1.5 md:pt-2">
												<div className="flex justify-between">
													<p className="font-sans text-[9px] text-muted-foreground md:text-[10px]">
														Subtotal:
													</p>
													<p className="font-sans text-[9px] text-foreground md:text-[10px]">
														$49.00
													</p>
												</div>
												<div className="flex justify-between">
													<p className="font-sans text-[9px] text-muted-foreground md:text-[10px]">
														Tax (Sales Tax 8.5%):
													</p>
													<p className="font-sans text-[9px] text-foreground md:text-[10px]">
														$4.17
													</p>
												</div>
												<div className="mt-1 flex justify-between border-border border-t pt-1 md:pt-1.5">
													<p className="font-medium font-sans text-[11px] text-foreground md:text-[12px]">
														Total:
													</p>
													<p className="font-medium font-sans text-[11px] text-foreground md:text-[12px]">
														$53.17
													</p>
												</div>
											</div>

											{/* Payment Info */}
											<div className="mt-1.5 border-border border-t pt-1.5 md:mt-2 md:pt-2">
												<p className="font-sans text-[9px] text-muted-foreground md:text-[10px]">
													Payment Method: Credit Card ending in 4242
												</p>
												<p className="mt-0.5 font-sans text-[9px] text-muted-foreground md:text-[10px]">
													Transaction ID: txn_CS2025_8K7M2N
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Action Bar */}
			<AnimatePresence>
				{showBar && (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="pointer-events-auto absolute right-2 bottom-2 left-2 z-30 flex items-center gap-2 border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-[7px] md:p-2"
						exit={{ opacity: 0, y: 20 }}
						initial={{ opacity: 0, y: 20 }}
						style={{ transform: "scale(0.9)" }}
						transition={{ duration: 0.3 }}
					>
						<div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
							<span className="pl-2 font-sans text-[10px] text-muted-foreground md:pl-3 md:text-[11px]">
								Supabase • $53.17 • Jun 15, 2025
							</span>
						</div>
						<div className="flex items-center gap-2">
							<button
								className="hidden h-7 flex-shrink-0 items-center justify-center border border-border bg-transparent px-2 text-[11px] text-foreground transition-colors hover:bg-muted md:flex md:h-8 md:px-3 md:text-[12px]"
								type="button"
							>
								Decline
							</button>
							<button
								className="flex items-center gap-1 border border-primary bg-primary px-2 py-1 text-primary-foreground transition-colors hover:bg-primary/90 md:px-3 md:py-1.5"
								type="button"
							>
								<span className="font-sans text-[10px] md:text-[11px]">
									Confirm
								</span>
								<MdCheck className="text-primary-foreground" size={14} />
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
