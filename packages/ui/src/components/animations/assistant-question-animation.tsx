"use client";

import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
	MdOutlineAccountBalanceWallet,
	MdOutlineReceipt,
} from "react-icons/md";
import { Icons } from "../icons";

const dynamicIconMap: Record<string, IconType> = {
	account_balance_wallet: MdOutlineAccountBalanceWallet,
	receipt: MdOutlineReceipt,
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

export function AssistantQuestionAnimation({
	onComplete,
	shouldPlay = true,
	isLightMode = false,
}: {
	onComplete?: () => void;
	shouldPlay?: boolean;
	isLightMode?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [showUserMessage, setShowUserMessage] = useState(false);
	const [displayedSegments, setDisplayedSegments] = useState<
		Array<{
			id: number;
			text: string;
			isComplete: boolean;
			showCards?: boolean;
		}>
	>([]);
	const [activeToolCall, setActiveToolCall] = useState<{
		text: string;
		icon: string;
	} | null>(null);
	const [isTyping, setIsTyping] = useState(false);
	const [showCards, setShowCards] = useState(false);
	const [cardsVisible, setCardsVisible] = useState<number[]>([]);

	const cards = [
		{
			icon: "account_balance_wallet",
			title: "Cash Balance",
			value: "$24,500",
			change: "+$3,200",
			changeType: "positive" as const,
			subtitle: "this month",
		},
		{
			icon: "trending_up",
			title: "Runway",
			value: "8.5 months",
			change: "+1.2 months",
			changeType: "positive" as const,
			subtitle: "vs last month",
		},
		{
			icon: "receipt",
			title: "Outstanding",
			value: "$8,400",
			change: "3 invoices",
			changeType: "neutral" as const,
			subtitle: "awaiting payment",
		},
		{
			icon: "savings",
			title: "Monthly Burn",
			value: "$2,900",
			change: "-$400",
			changeType: "positive" as const,
			subtitle: "vs last month",
		},
	];

	const responseSegments = [
		{
			id: 1,
			text: "# Cash Flow Analysis — October 2025\n\n## Current Status\n\nYour cash position is strong with $24,500 in the bank. Your runway has improved to 8.5 months, giving you solid financial stability. Monthly burn rate decreased by $400 compared to last month.",
			toolCall: {
				text: "Analyzing cash flow data",
				icon: "account_balance_wallet",
				duration: 2000,
			},
			showCards: true,
		},
		{
			id: 2,
			text: "## Recommendations\n\nYou have $8,400 in outstanding invoices (3 invoices). Consider following up on payments older than 30 days to improve cash collection. Your reduced burn rate suggests good cost control—maintain this discipline to extend your runway further.",
			toolCall: {
				text: "Reviewing payment status",
				icon: "receipt",
				duration: 1600,
			},
		},
	];

	const renderMarkdown = (text: string) => {
		const lines = text.split("\n");
		const elements: ReactElement[] = [];
		let elementKey = 0;

		for (const line of lines) {
			const key = `line-${elementKey++}`;
			if (line.trim() === "") {
				elements.push(<div className="h-1" key={key} />);
			} else if (line.startsWith("# ")) {
				elements.push(
					<h1
						className="mt-2 mb-1 text-[14px] text-foreground first:mt-0 md:mt-3 md:mb-2"
						key={key}
					>
						{line.slice(2)}
					</h1>
				);
			} else if (line.startsWith("## ")) {
				elements.push(
					<h2
						className="mt-2 mb-1 text-[12px] text-foreground md:mt-3 md:mb-2"
						key={key}
					>
						{line.slice(3)}
					</h2>
				);
			} else {
				elements.push(
					<p
						className="mb-1 text-[11px] text-foreground leading-[15px] md:mb-1.5 md:text-[12px] md:leading-[18px]"
						key={key}
					>
						{line}
					</p>
				);
			}
		}
		return elements;
	};

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		const processSegments = () => {
			let segmentIndex = 0;

			const processNextSegment = () => {
				if (segmentIndex >= responseSegments.length) {
					setIsTyping(false);
					return;
				}

				const segment = responseSegments[segmentIndex];
				if (!segment) {
					setIsTyping(false);
					return;
				}

				const words = segment.text.split(" ");
				let wordIndex = 0;

				const typeWords = () => {
					if (wordIndex < words.length) {
						const currentText = words.slice(0, wordIndex + 1).join(" ");
						setDisplayedSegments((prev) => [
							...prev.slice(0, segmentIndex),
							{
								id: segment.id,
								text: currentText,
								isComplete: false,
								showCards: segment.showCards,
							},
						]);
						wordIndex++;
						setTimeout(typeWords, 30);
					} else {
						setDisplayedSegments((prev) => [
							...prev.slice(0, segmentIndex),
							{
								id: segment.id,
								text: segment.text,
								isComplete: true,
								showCards: segment.showCards,
							},
						]);

						if (segment.toolCall) {
							setActiveToolCall(segment.toolCall);
							setTimeout(() => {
								setActiveToolCall(null);
								segmentIndex++;
								setTimeout(processNextSegment, 200);
							}, segment.toolCall.duration);
						} else {
							segmentIndex++;
							setTimeout(processNextSegment, 200);
						}
					}
				};

				typeWords();
			};

			processNextSegment();
		};

		setTimeout(() => {
			setShowUserMessage(true);
		}, 500);

		setTimeout(() => {
			setIsTyping(true);
			processSegments();
		}, 1000);

		const doneTimer = onComplete
			? setTimeout(() => {
					onComplete();
				}, 12_000)
			: undefined;

		return () => {
			if (doneTimer) {
				clearTimeout(doneTimer);
			}
		};
	}, [shouldPlay, onComplete]);

	useEffect(() => {
		if (
			displayedSegments.length > 0 &&
			displayedSegments[0]?.isComplete &&
			displayedSegments[0]?.showCards
		) {
			setShowCards(true);
			cards.forEach((_, cardIndex) => {
				setTimeout(() => {
					setCardsVisible((prev) => [...prev, cardIndex]);
				}, cardIndex * 150);
			});
		}
	}, [displayedSegments]);

	return (
		<div className="relative flex h-full w-full flex-col" ref={containerRef}>
			<div className="flex-1 overflow-hidden px-2 py-2 md:px-3 md:py-3">
				<div className="flex h-full flex-col space-y-2 md:space-y-4">
					<div className="flex justify-end">
						<div
							className={`max-w-[85%] rounded-tl-[100px] rounded-bl-[100px] bg-secondary px-2 py-1 transition-opacity duration-75 ease-out md:max-w-xs ${
								showUserMessage ? "opacity-100" : "opacity-0"
							}`}
						>
							<p className="text-right text-[11px] text-foreground md:text-[12px]">
								How's my cash flow looking?
							</p>
						</div>
					</div>

					<div className="flex-1 overflow-hidden">
						{displayedSegments.length === 0 && isTyping && (
							<div className="flex justify-start">
								<div className="flex w-full max-w-full flex-col">
									<div className="animate-shimmer text-[12px] text-foreground leading-[16px]">
										Analyzing cash flow and runway
									</div>
								</div>
							</div>
						)}

						{displayedSegments.map((segment, index) => (
							<div
								className={index > 0 ? "mt-3 md:mt-5" : ""}
								key={`${segment.id}-${index}`}
							>
								<div className="flex justify-start">
									<div className="flex w-full max-w-full flex-col">
										<div className="prose prose-sm max-w-none">
											{renderMarkdown(segment.text)}
										</div>
										{!segment.isComplete && (
											<div className="mt-2 flex items-center gap-0.5 md:mt-3">
												<div
													className="h-0.5 w-0.5 animate-pulse bg-foreground"
													style={{ borderRadius: "0" }}
												/>
												<div
													className="h-0.5 w-0.5 animate-pulse bg-foreground"
													style={{
														animationDelay: "0.2s",
														borderRadius: "0",
													}}
												/>
												<div
													className="h-0.5 w-0.5 animate-pulse bg-foreground"
													style={{
														animationDelay: "0.4s",
														borderRadius: "0",
													}}
												/>
											</div>
										)}
									</div>
								</div>

								{segment.isComplete && segment.showCards && showCards && (
									<div className="mt-4 flex justify-start md:mt-6">
										<div className="w-full">
											<div className="grid grid-cols-2 gap-2 md:gap-3">
												{cards.map((card, cardIndex) => (
													<motion.div
														animate={{
															opacity: cardsVisible.includes(cardIndex) ? 1 : 0,
															scale: cardsVisible.includes(cardIndex) ? 1 : 0.9,
														}}
														className="border border-border bg-secondary p-1.5 md:p-2"
														initial={{ opacity: 0, scale: 0.9 }}
														key={card.title}
														transition={{ duration: 0.3 }}
													>
														<div className="mb-0.5 text-[9px] text-muted-foreground md:mb-1 md:text-[10px]">
															{card.title}
														</div>
														<div className="font-serif text-[12px] text-foreground md:text-[14px]">
															{card.value}
														</div>
														<div className="mt-0.5 text-[7px] text-muted-foreground md:mt-1 md:text-[8px]">
															{card.change} {card.subtitle}
														</div>
													</motion.div>
												))}
											</div>
										</div>
									</div>
								)}

								{segment.isComplete &&
									index === displayedSegments.length - 1 &&
									activeToolCall && (
										<div className="mt-3 flex animate-fade-in justify-start md:mt-4">
											<div className="flex h-6 w-fit items-center gap-2 border border-border bg-secondary px-2 py-1">
												<DynamicIcon
													className="text-muted-foreground"
													name={activeToolCall.icon}
													size={12}
												/>
												<motion.span
													animate={{
														backgroundPosition: ["200% 0", "-200% 0"],
													}}
													className="relative inline-block bg-[length:200%_100%] bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-clip-text text-[10px] text-transparent leading-[14px]"
													transition={{
														duration: 2,
														repeat: Number.POSITIVE_INFINITY,
														ease: "linear",
													}}
												>
													{activeToolCall.text}
												</motion.span>
											</div>
										</div>
									)}
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Bottom Bar */}
			<div className="border border-border bg-secondary">
				{/* Input Field */}
				<div className="flex items-center px-2 py-1.5 md:px-3 md:py-2">
					<input
						className="flex-1 border-0 bg-transparent text-[10px] text-foreground outline-none placeholder:text-muted-foreground md:text-[11px]"
						placeholder="Ask anything"
						readOnly
						type="text"
					/>
				</div>

				{/* Icons Row */}
				<div className="flex items-end justify-between px-2 pb-1.5 md:px-3 md:pb-2">
					<div className="flex items-center gap-1 md:gap-1.5">
						<button
							className="flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors md:h-5 md:w-5"
							type="button"
						>
							<Icons.Add className="md:h-[14px] md:w-[14px]" size={12} />
						</button>
						<button
							className="flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors md:h-5 md:w-5"
							type="button"
						>
							<Icons.Bolt className="md:h-[14px] md:w-[14px]" size={12} />
						</button>
						<button
							className="flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors md:h-5 md:w-5"
							type="button"
						>
							<Icons.Globle className="md:h-[14px] md:w-[14px]" size={12} />
						</button>
						<button
							className="flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors md:h-5 md:w-5"
							type="button"
						>
							<Icons.Time className="md:h-[14px] md:w-[14px]" size={12} />
						</button>
					</div>
					<div className="flex items-end gap-1 md:gap-1.5">
						<button
							className="flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors md:h-5 md:w-5"
							type="button"
						>
							<Icons.Record className="md:h-[14px] md:w-[14px]" size={12} />
						</button>
						<button
							className="flex h-4 w-4 items-center justify-center bg-foreground transition-opacity md:h-5 md:w-5"
							type="button"
						>
							<Icons.ArrowUpward
								className="text-background md:h-[12px] md:w-[12px]"
								size={10}
							/>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
