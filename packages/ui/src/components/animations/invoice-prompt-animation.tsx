"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdOutlineOpenInNew } from "react-icons/md";

export function InvoicePromptAnimation({
	onComplete,
	shouldPlay = true,
}: {
	onComplete?: () => void;
	shouldPlay?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [showUserMessage, setShowUserMessage] = useState(false);
	const [showInvoice, setShowInvoice] = useState(false);
	const [visibleSections, setVisibleSections] = useState<number[]>([]);

	const userPrompt =
		"Create an invoice to Acme for 20 development hours and 10 design hours";

	const developmentRate = 100;
	const designRate = 100;
	const developmentQty = 20;
	const designQty = 10;

	const subtotal = developmentQty * developmentRate + designQty * designRate;
	const tax = subtotal * 0.1;
	const total = subtotal + tax;

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		const t1 = setTimeout(() => setShowUserMessage(true), 0);

		const t2 = setTimeout(() => {
			setShowInvoice(true);
			const order = [0, 1, 2, 3, 4];
			order.forEach((sec, idx) => {
				setTimeout(
					() => setVisibleSections((prev) => [...prev, sec]),
					200 + idx * 160
				);
			});
		}, 1000);

		const doneTimer = onComplete
			? setTimeout(() => {
					onComplete();
				}, 12_000)
			: undefined;

		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
			if (doneTimer) {
				clearTimeout(doneTimer);
			}
		};
	}, [shouldPlay, onComplete]);

	return (
		<div className="relative flex h-full w-full flex-col" ref={containerRef}>
			<div className="flex-1 overflow-hidden px-2 py-2 md:px-3 md:py-3">
				<div className="flex h-full flex-col space-y-2 md:space-y-3">
					<div className="flex justify-end">
						<div
							className={`max-w-[85%] rounded-tl-[100px] rounded-bl-[100px] bg-secondary py-1 pr-2 pl-1.5 transition-opacity duration-75 md:max-w-xs ${
								showUserMessage ? "opacity-100" : "opacity-0"
							}`}
						>
							<p className="text-right text-[11px] text-foreground md:text-[12px]">
								{userPrompt}
							</p>
						</div>
					</div>

					<div className="flex-1 overflow-hidden">
						{showInvoice && (
							<div className="mt-3">
								<motion.div
									animate={{
										opacity: visibleSections.includes(0) ? 1 : 0,
										y: visibleSections.includes(0) ? 0 : 6,
									}}
									className="mb-4"
									initial={{ opacity: 0, y: 6 }}
									transition={{ duration: 0.25 }}
								>
									<h4 className="font-normal font-serif text-[16px] text-foreground md:text-[18px]">
										Invoice
									</h4>
								</motion.div>

								<motion.div
									animate={{
										opacity: visibleSections.includes(1) ? 1 : 0,
										y: visibleSections.includes(1) ? 0 : 6,
									}}
									className="mb-6"
									initial={{ opacity: 0, y: 6 }}
									transition={{ duration: 0.25 }}
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex flex-col gap-0.5 md:gap-1">
											<div className="text-[11px] text-muted-foreground md:text-[12px]">
												From
											</div>
											<div className="text-[11px] text-foreground md:text-[12px]">
												Your Company
											</div>
											<div className="break-all text-[11px] text-muted-foreground md:text-[12px]">
												hello@company.com
											</div>
										</div>
										<div className="flex flex-col gap-0.5 text-right md:gap-1">
											<div className="text-[11px] text-muted-foreground md:text-[12px]">
												To
											</div>
											<div className="text-[11px] text-foreground md:text-[12px]">
												Acme
											</div>
											<div className="break-all text-[11px] text-muted-foreground md:text-[12px]">
												billing@acme.com
											</div>
										</div>
									</div>
									<div className="mt-3 grid grid-cols-3 gap-1.5 md:mt-4 md:gap-2">
										<div className="text-[11px] text-muted-foreground md:text-[12px]">
											Invoice #
										</div>
										<div className="text-[11px] text-muted-foreground md:text-[12px]">
											Issue date
										</div>
										<div className="text-right text-[11px] text-muted-foreground md:text-[12px]">
											Due in
										</div>
										<div className="text-[11px] text-foreground md:text-[12px]">
											INV-001
										</div>
										<div className="text-[11px] text-foreground md:text-[12px]">
											Sep 29, 2025
										</div>
										<div className="text-right text-[11px] text-foreground md:text-[12px]">
											14 days
										</div>
									</div>
								</motion.div>

								<motion.div
									animate={{
										opacity: visibleSections.includes(2) ? 1 : 0,
										y: visibleSections.includes(2) ? 0 : 6,
									}}
									initial={{ opacity: 0, y: 6 }}
									transition={{ duration: 0.25 }}
								>
									<div className="grid grid-cols-12 border-border border-b py-1.5 md:py-2">
										<div className="col-span-5 text-[10px] text-muted-foreground md:col-span-6 md:text-[12px]">
											Description
										</div>
										<div className="col-span-2 text-right text-[10px] text-muted-foreground md:text-[12px]">
											Qty
										</div>
										<div className="col-span-2 text-right text-[10px] text-muted-foreground md:text-[12px]">
											Rate
										</div>
										<div className="col-span-3 text-right text-[10px] text-muted-foreground md:col-span-2 md:text-[12px]">
											Amount
										</div>
									</div>

									<div className="grid grid-cols-12 py-2 md:py-3">
										<div className="col-span-5 text-[10px] text-foreground md:col-span-6 md:text-[12px]">
											Development
										</div>
										<div className="col-span-2 text-right text-[10px] text-foreground md:text-[12px]">
											{developmentQty}
										</div>
										<div className="col-span-2 text-right text-[10px] text-foreground md:text-[12px]">
											${developmentRate.toFixed(2)}
										</div>
										<div className="col-span-3 text-right text-[10px] text-foreground md:col-span-2 md:text-[12px]">
											${(developmentQty * developmentRate).toFixed(2)}
										</div>
									</div>
									<div className="grid grid-cols-12 border-border border-b py-2 md:py-3">
										<div className="col-span-5 text-[10px] text-foreground md:col-span-6 md:text-[12px]">
											Design
										</div>
										<div className="col-span-2 text-right text-[10px] text-foreground md:text-[12px]">
											{designQty}
										</div>
										<div className="col-span-2 text-right text-[10px] text-foreground md:text-[12px]">
											${designRate.toFixed(2)}
										</div>
										<div className="col-span-3 text-right text-[10px] text-foreground md:col-span-2 md:text-[12px]">
											${(designQty * designRate).toFixed(2)}
										</div>
									</div>
								</motion.div>

								<motion.div
									animate={{
										opacity: visibleSections.includes(3) ? 1 : 0,
										y: visibleSections.includes(3) ? 0 : 6,
									}}
									className="mt-4"
									initial={{ opacity: 0, y: 6 }}
									transition={{ duration: 0.25 }}
								>
									<div className="grid grid-cols-12 py-1.5 md:py-2">
										<div className="col-span-7 md:col-span-8" />
										<div className="col-span-2 text-right text-[10px] text-muted-foreground md:text-[12px]">
											Subtotal
										</div>
										<div className="col-span-3 text-right text-[10px] text-foreground md:col-span-2 md:text-[12px]">
											${subtotal.toFixed(2)}
										</div>
									</div>
									<div className="grid grid-cols-12 py-1.5 md:py-2">
										<div className="col-span-7 md:col-span-8" />
										<div className="col-span-2 text-right text-[10px] text-muted-foreground md:text-[12px]">
											Tax (10%)
										</div>
										<div className="col-span-3 text-right text-[10px] text-foreground md:col-span-2 md:text-[12px]">
											${tax.toFixed(2)}
										</div>
									</div>
									<div className="grid grid-cols-12 border-border border-t py-1.5 md:py-2">
										<div className="col-span-7 md:col-span-8" />
										<div className="col-span-2 text-right text-[10px] text-muted-foreground md:text-[12px]">
											Total
										</div>
										<div className="col-span-3 text-right text-[10px] text-foreground md:col-span-2 md:text-[12px]">
											${total.toFixed(2)}
										</div>
									</div>
								</motion.div>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="px-2 pt-1 pb-2 md:px-3 md:pb-3">
				<motion.div
					animate={{
						opacity: visibleSections.includes(4) ? 1 : 0,
						y: visibleSections.includes(4) ? 0 : 6,
					}}
					className="border-border border-t pt-2 md:pt-3"
					initial={{ opacity: 0, y: 6 }}
					transition={{ duration: 0.25 }}
				>
					<div className="py-0.5 md:py-1">
						<div className="text-[11px] text-muted-foreground md:text-[12px]">
							Payment Details
						</div>
						<div className="break-words text-[11px] text-foreground md:text-[12px]">
							Bank: Example Bank, IBAN: XX00 0000 0000 0000 0000
						</div>
						<div className="text-[11px] text-foreground md:text-[12px]">
							Reference: INV-001
						</div>
					</div>
					<div className="mt-1.5 flex items-end justify-between md:mt-2">
						<button
							className="flex items-center gap-1 text-[11px] text-muted-foreground leading-[15px] hover:text-foreground md:text-[12px] md:leading-[16px]"
							type="button"
						>
							<MdOutlineOpenInNew size={11} />
							<span>Preview invoice</span>
						</button>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
