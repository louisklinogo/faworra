"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
	MdOutlineFilterList,
	MdOutlineLink,
	MdOutlinePictureAsPdf,
	MdOutlineReceipt,
	MdOutlineReceiptLong,
	MdSearch,
} from "react-icons/md";

const dynamicIconMap: Record<string, IconType> = {
	pdf: MdOutlinePictureAsPdf,
	receipt: MdOutlineReceipt,
	receipt_long: MdOutlineReceiptLong,
};

function DynamicIcon({
	name,
	className,
	size,
}: {
	name: string;
	className?: string;
	size?: number;
}) {
	const Icon = dynamicIconMap[name];
	return Icon ? <Icon className={className} size={size} /> : null;
}

export function InboxMatchAnimation({
	onComplete,
	shouldPlay = true,
}: {
	onComplete?: () => void;
	shouldPlay?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [showIncoming, setShowIncoming] = useState(false);
	const [showSuggestBar, setShowSuggestBar] = useState(false);
	const [showItems, setShowItems] = useState(false);
	const items = [
		{
			id: 1,
			title: "Google-invoice.pdf",
			amount: "$12.00",
			date: "Sep 08",
			icon: "pdf",
		},
		{
			id: 2,
			title: "AWS-receipt.pdf",
			amount: "$54.30",
			date: "Sep 07",
			icon: "receipt",
		},
		{
			id: 3,
			title: "Figma-receipt.pdf",
			amount: "$24.00",
			date: "Sep 06",
			icon: "receipt_long",
		},
		{
			id: 4,
			title: "GitHub-receipt.pdf",
			amount: "$9.00",
			date: "Sep 05",
			icon: "pdf",
		},
		{
			id: 5,
			title: "Notion-receipt.pdf",
			amount: "$16.00",
			date: "Sep 04",
			icon: "receipt",
		},
		{
			id: 6,
			title: "Slack-receipt.pdf",
			amount: "$8.50",
			date: "Sep 03",
			icon: "receipt_long",
		},
	];
	const incomingItem = {
		id: 999,
		title: "Stripe-receipt.pdf",
		amount: "$89.00",
		date: "Sep 10",
	};

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		const itemsTimer = setTimeout(() => setShowItems(true), 0);
		const incomingTimer = setTimeout(() => setShowIncoming(true), 1100);
		const barTimer = setTimeout(() => setShowSuggestBar(true), 1500);

		const doneTimer = onComplete
			? setTimeout(() => {
					onComplete();
				}, 12_000)
			: undefined;

		return () => {
			clearTimeout(itemsTimer);
			clearTimeout(incomingTimer);
			clearTimeout(barTimer);
			if (doneTimer) {
				clearTimeout(doneTimer);
			}
		};
	}, [shouldPlay, onComplete]);

	return (
		<div className="relative flex h-full w-full flex-col" ref={containerRef}>
			<div className="px-2 pt-2 pb-1 md:px-3 md:pt-3">
				<div className="mb-2 flex items-center justify-between md:mb-3">
					<h3 className="text-[13px] text-foreground md:text-[14px]">Inbox</h3>
					<div className="flex items-center gap-2">
						<button
							className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-muted"
							type="button"
						>
							<MdOutlineFilterList
								className="text-muted-foreground text-sm"
								size={16}
							/>
						</button>
					</div>
				</div>
				<div className="relative">
					<input
						className="w-full rounded-none border border-border bg-background px-2 py-1.5 pr-7 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-border/50 focus:outline-none md:px-3 md:py-2 md:pr-8 md:text-[12px]"
						placeholder="Search inbox..."
						type="text"
					/>
					<MdSearch
						className="absolute top-1/2 right-2 -translate-y-1/2 transform text-muted-foreground text-sm md:right-3"
						size={14}
					/>
				</div>
			</div>

			<div className="relative flex-1 overflow-visible px-2 pb-2 md:px-3 md:pb-3">
				<div className="flex h-full flex-col justify-end gap-1.5 pt-0 pb-24 md:gap-2 md:pb-32">
					{items.slice(1).map((item, idx) => (
						<motion.div
							animate={{ opacity: showItems ? 1 : 0 }}
							className="transform-gpu border border-border bg-background p-2 will-change-transform md:p-3"
							initial={{ opacity: 0 }}
							key={item.id}
							transition={{
								duration: 0.25,
								delay: showItems ? idx * 0.1 : 0,
							}}
						>
							<div className="flex items-start gap-1.5 md:gap-2">
								<span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center border border-border bg-secondary md:h-6 md:w-6">
									<DynamicIcon
										className="text-muted-foreground text-sm"
										name={item.icon}
										size={14}
									/>
								</span>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-1.5 md:gap-2">
										<p className="truncate text-[11px] text-foreground md:text-[12px]">
											{item.title}
										</p>
										<span className="whitespace-nowrap text-[11px] text-muted-foreground md:text-[12px]">
											{item.amount}
										</span>
									</div>
									<div className="mt-0.5 flex items-center justify-between md:mt-1">
										<span className="text-[9px] text-muted-foreground md:text-[10px]">
											Inbox
										</span>
										<span className="text-[9px] text-muted-foreground md:text-[10px]">
											{item.date}
										</span>
									</div>
								</div>
							</div>
						</motion.div>
					))}
					{showIncoming && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="absolute right-2 bottom-[48px] left-2 z-50 transform-gpu border border-border bg-secondary p-2 will-change-transform md:right-3 md:bottom-[68px] md:left-3 md:p-3"
							initial={{ opacity: 0, y: 48 }}
							key={incomingItem.id}
							transition={{
								type: "spring",
								stiffness: 250,
								damping: 24,
								mass: 0.6,
							}}
						>
							<div className="flex items-start gap-1.5 md:gap-2">
								<span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center border border-border bg-secondary md:h-6 md:w-6">
									<Image
										alt="Gmail"
										className="h-3 w-3 object-contain md:h-3.5 md:w-3.5"
										height={16}
										src="/images/gmail.svg"
										width={16}
									/>
								</span>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-1.5 md:gap-2">
										<p className="truncate text-[11px] text-foreground md:text-[12px]">
											{incomingItem.title}
										</p>
										<span className="whitespace-nowrap text-[11px] text-muted-foreground md:text-[12px]">
											{incomingItem.amount}
										</span>
									</div>
									<div className="mt-0.5 flex items-center justify-between md:mt-1">
										<span className="truncate text-[9px] text-muted-foreground md:text-[10px]">
											From: receipts@stripe.com
										</span>
										<span className="ml-1 text-[9px] text-muted-foreground md:text-[10px]">
											{incomingItem.date}
										</span>
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</div>
			</div>

			<motion.div
				animate={{
					opacity: showSuggestBar ? 1 : 0,
					y: showSuggestBar ? 0 : 10,
				}}
				className="relative z-40 px-2 pt-2 pb-2 md:px-3 md:pt-3 md:pb-3"
				initial={{ opacity: 0, y: 10 }}
				transition={{ duration: 0.25 }}
			>
				<div className="flex w-full items-center justify-between gap-2 border border-border bg-secondary px-2 py-2 md:px-3 md:py-3">
					<div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
						<MdOutlineLink
							className="flex-shrink-0 text-muted-foreground text-sm"
							size={14}
						/>
						<div className="min-w-0 flex-1">
							<div className="truncate text-[11px] text-foreground md:text-[12px]">
								Suggested match
							</div>
							<div className="truncate text-[10px] text-muted-foreground md:text-[12px]">
								Transaction • Stripe • $89.00 • Sep 10
							</div>
						</div>
					</div>
					<button
						className="ml-2 flex h-7 flex-shrink-0 items-center justify-center border border-border bg-transparent px-2 text-[11px] text-foreground transition-colors hover:bg-muted md:ml-3 md:h-8 md:px-3 md:text-[12px]"
						type="button"
					>
						Review
					</button>
				</div>
			</motion.div>
		</div>
	);
}
