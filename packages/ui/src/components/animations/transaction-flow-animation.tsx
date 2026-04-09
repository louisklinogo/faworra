"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
	MdOutlineAccountBalance,
	MdOutlineAccountBalanceWallet,
	MdOutlineCreditCard,
	MdOutlineSavings,
} from "react-icons/md";

const dynamicIconMap: Record<string, IconType> = {
	account_balance: MdOutlineAccountBalance,
	credit_card: MdOutlineCreditCard,
	account_balance_wallet: MdOutlineAccountBalanceWallet,
	savings: MdOutlineSavings,
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

interface AccountNode {
	color: string;
	icon: string;
	id: number;
	label: string;
	x: number;
	y: number;
}

interface Transaction {
	amount: number;
	category: string;
	categoryColor: string;
	date: string;
	description: string;
	id: number;
	taxAmount: number;
}

export function TransactionFlowAnimation({
	onComplete,
	shouldPlay = true,
}: {
	onComplete?: () => void;
	shouldPlay?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [showAccounts, setShowAccounts] = useState(false);
	const [showArrows, setShowArrows] = useState(false);
	const [showTransactions, setShowTransactions] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const topY = isMobile ? 60 : 80;
	const nodeSpacing = 90;
	const viewBoxWidth = 500;
	const totalNodesWidth = nodeSpacing * 3;
	const startX = (viewBoxWidth - totalNodesWidth) / 2;

	const accountNodes: AccountNode[] = [
		{
			id: 1,
			x: startX,
			y: topY,
			label: "Account",
			color: "hsl(var(--muted-foreground))",
			icon: "account_balance",
		},
		{
			id: 2,
			x: startX + nodeSpacing,
			y: topY,
			label: "Account",
			color: "hsl(var(--muted-foreground))",
			icon: "credit_card",
		},
		{
			id: 3,
			x: startX + nodeSpacing * 2,
			y: topY,
			label: "Account",
			color: "hsl(var(--muted-foreground))",
			icon: "account_balance_wallet",
		},
		{
			id: 4,
			x: startX + nodeSpacing * 3,
			y: topY,
			label: "Account",
			color: "hsl(var(--muted-foreground))",
			icon: "savings",
		},
	];

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("sv-SE", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(Math.abs(amount));
	};

	const transactions: Transaction[] = [
		{
			id: 1,
			description: "Office Supplies Co.",
			amount: -45.2,
			taxAmount: 9.04,
			date: "Sep 10",
			category: "Office Supplies",
			categoryColor: "#1976D2",
		},
		{
			id: 2,
			description: "Cloud Services Inc.",
			amount: -89.0,
			taxAmount: 17.8,
			date: "Sep 10",
			category: "Software",
			categoryColor: "#2196F3",
		},
		{
			id: 3,
			description: "Freelance Payment",
			amount: 1200.0,
			taxAmount: 0,
			date: "Sep 09",
			category: "Income",
			categoryColor: "#4CAF50",
		},
		{
			id: 4,
			description: "Marketing Agency",
			amount: -350.0,
			taxAmount: 70.0,
			date: "Sep 09",
			category: "Marketing",
			categoryColor: "#9C27B0",
		},
		{
			id: 5,
			description: "Software Subscription",
			amount: -24.0,
			taxAmount: 4.8,
			date: "Sep 08",
			category: "Software",
			categoryColor: "#2196F3",
		},
		{
			id: 6,
			description: "AWS",
			amount: -1820.5,
			taxAmount: 364.1,
			date: "Sep 08",
			category: "Infrastructure",
			categoryColor: "#FF9800",
		},
		{
			id: 7,
			description: "Stripe Payment",
			amount: 2450.0,
			taxAmount: 0,
			date: "Sep 07",
			category: "Income",
			categoryColor: "#4CAF50",
		},
		{
			id: 8,
			description: "Figma",
			amount: -225.88,
			taxAmount: 45.18,
			date: "Sep 07",
			category: "Office Supplies",
			categoryColor: "#1976D2",
		},
		{
			id: 9,
			description: "Webflow",
			amount: -176.36,
			taxAmount: 35.27,
			date: "Sep 06",
			category: "Software",
			categoryColor: "#2196F3",
		},
		{
			id: 10,
			description: "GitHub",
			amount: -44.0,
			taxAmount: 8.8,
			date: "Sep 06",
			category: "Software",
			categoryColor: "#2196F3",
		},
		{
			id: 11,
			description: "Notion",
			amount: -120.0,
			taxAmount: 24.0,
			date: "Sep 05",
			category: "Software",
			categoryColor: "#2196F3",
		},
		{
			id: 12,
			description: "OpenAI",
			amount: -89.5,
			taxAmount: 17.9,
			date: "Sep 05",
			category: "Software",
			categoryColor: "#2196F3",
		},
		{
			id: 13,
			description: "Vercel",
			amount: -299.0,
			taxAmount: 59.8,
			date: "Sep 04",
			category: "Infrastructure",
			categoryColor: "#FF9800",
		},
		{
			id: 14,
			description: "Adobe",
			amount: -649.0,
			taxAmount: 129.8,
			date: "Sep 04",
			category: "Software",
			categoryColor: "#2196F3",
		},
		{
			id: 15,
			description: "Client Invoice",
			amount: 8500.0,
			taxAmount: 0,
			date: "Sep 03",
			category: "Income",
			categoryColor: "#4CAF50",
		},
	];

	const transactionListTopY = isMobile ? 180 : 200;
	const viewBoxHeight = isMobile ? 180 : 200;

	const arrowPaths = [
		{
			id: 1,
			from: { x: accountNodes[0]?.x ?? 0, y: (accountNodes[0]?.y ?? 0) + 18 },
			to: { x: accountNodes[0]?.x ?? 0, y: transactionListTopY },
		},
		{
			id: 2,
			from: { x: accountNodes[1]?.x ?? 0, y: (accountNodes[1]?.y ?? 0) + 18 },
			to: { x: accountNodes[1]?.x ?? 0, y: transactionListTopY },
		},
		{
			id: 3,
			from: { x: accountNodes[2]?.x ?? 0, y: (accountNodes[2]?.y ?? 0) + 18 },
			to: { x: accountNodes[2]?.x ?? 0, y: transactionListTopY },
		},
		{
			id: 4,
			from: { x: accountNodes[3]?.x ?? 0, y: (accountNodes[3]?.y ?? 0) + 18 },
			to: { x: accountNodes[3]?.x ?? 0, y: transactionListTopY },
		},
	] as const;

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		const accountsTimer = setTimeout(() => setShowAccounts(true), 0);
		const arrowsTimer = setTimeout(() => setShowArrows(true), 500);
		const transactionsTimer = setTimeout(() => setShowTransactions(true), 900);

		const doneTimer = onComplete
			? setTimeout(() => {
					onComplete();
				}, 10_000)
			: undefined;

		return () => {
			clearTimeout(accountsTimer);
			clearTimeout(arrowsTimer);
			clearTimeout(transactionsTimer);
			if (doneTimer) {
				clearTimeout(doneTimer);
			}
		};
	}, [shouldPlay, onComplete]);

	return (
		<div
			className="relative flex h-full w-full flex-col overflow-hidden"
			ref={containerRef}
		>
			{/* Header */}
			<div className="relative z-10 border-border border-b px-2 pt-2 pb-1.5 md:px-3 md:pt-3 md:pb-2">
				<h3 className="text-[13px] text-foreground md:text-[14px]">
					Transactions
				</h3>
			</div>

			{/* Main content area */}
			<div className="relative z-10 flex flex-1 flex-col overflow-hidden">
				{/* SVG for account nodes and arrows */}
				<div className="relative h-[140px] flex-shrink-0 overflow-hidden md:h-[200px]">
					<svg
						className="h-full w-full"
						preserveAspectRatio="xMidYMin meet"
						style={{ display: "block" }}
						viewBox={`0 0 500 ${viewBoxHeight}`}
					>
						{accountNodes.map((node, _index) => (
							<g key={node.id}>
								<rect
									fill="hsl(var(--secondary))"
									height={36}
									opacity={showAccounts ? 1 : 0}
									rx={0}
									stroke="hsl(var(--border))"
									strokeWidth={1}
									width={36}
									x={node.x - 18}
									y={node.y - 18}
								/>
								<foreignObject
									height={36}
									style={{ overflow: "visible" }}
									width={36}
									x={node.x - 18}
									y={node.y - 18}
								>
									<div
										style={{
											width: "100%",
											height: "100%",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<div
											style={{
												color: "hsl(var(--muted-foreground))",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												opacity: showAccounts ? 1 : 0,
											}}
										>
											<DynamicIcon name={node.icon} size={18} />
										</div>
									</div>
								</foreignObject>
								<text
									className="hidden md:block"
									fill="hsl(var(--muted-foreground))"
									fontSize="9"
									opacity={showAccounts ? 1 : 0}
									textAnchor="middle"
									x={node.x}
									y={node.y - 25}
								>
									{node.label}
								</text>
							</g>
						))}

						{arrowPaths.map((arrow, index) => {
							const pathId = `arrow-${arrow.id}`;
							const pathD = `M ${arrow.from.x} ${arrow.from.y} L ${arrow.to.x} ${arrow.to.y}`;
							const dashLength = 4;
							const gapLength = 3;
							const totalDashLength = dashLength + gapLength;

							return (
								<motion.path
									animate={{
										opacity: showArrows ? 1 : 0,
										strokeDashoffset: showArrows ? [0, -totalDashLength] : 0,
									}}
									d={pathD}
									fill="none"
									initial={{ opacity: 0, strokeDashoffset: 0 }}
									key={pathId}
									stroke="hsl(var(--border))"
									strokeDasharray={`${dashLength} ${gapLength}`}
									strokeWidth={1}
									transition={{
										opacity: { duration: 0.3, delay: index * 0.15 },
										strokeDashoffset: {
											duration: 2,
											repeat: Number.POSITIVE_INFINITY,
											ease: "linear",
											delay: index * 0.15 + 0.3,
										},
									}}
								/>
							);
						})}
					</svg>
				</div>

				{/* Transaction list */}
				<div className="min-h-0 flex-1 overflow-hidden border border-border bg-background">
					<table
						className="w-full border-collapse"
						style={{ borderSpacing: 0 }}
					>
						<thead className="sticky top-0 z-10 border-border border-b bg-secondary">
							<tr className="h-[28px] md:h-[32px]">
								<th className="w-[60px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[70px] md:px-2 md:text-[11px]">
									Date
								</th>
								<th className="w-[140px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[160px] md:px-2 md:text-[11px]">
									Description
								</th>
								<th className="w-[90px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[100px] md:px-2 md:text-[11px]">
									Amount
								</th>
								<th className="w-[110px] px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[120px] md:px-2 md:text-[11px]">
									Category
								</th>
							</tr>
						</thead>
						<tbody>
							{transactions.map((transaction, index) => (
								<motion.tr
									animate={{
										opacity: showTransactions ? 1 : 0,
										y: showTransactions ? 0 : 10,
									}}
									className="h-[28px] border-border border-b bg-background transition-colors hover:bg-secondary md:h-[32px]"
									initial={{ opacity: 0, y: 10 }}
									key={transaction.id}
									transition={{
										duration: 0.3,
										delay: index * 0.08,
										ease: "easeOut",
									}}
								>
									<td className="w-[60px] border-border border-r px-1.5 text-[10px] text-muted-foreground md:w-[70px] md:px-2 md:text-[11px]">
										{transaction.date}
									</td>
									<td
										className={`w-[140px] border-border border-r px-1.5 text-[10px] md:w-[160px] md:px-2 md:text-[11px] ${
											transaction.amount > 0
												? "text-[#4CAF50]"
												: "text-foreground"
										}`}
									>
										<div className="truncate" title={transaction.description}>
											{transaction.description}
										</div>
									</td>
									<td
										className={`w-[90px] border-border border-r px-1.5 text-[10px] md:w-[100px] md:px-2 md:text-[11px] ${
											transaction.amount > 0
												? "text-[#4CAF50]"
												: "text-foreground"
										}`}
									>
										{transaction.amount > 0 ? "+" : "-"}
										{formatAmount(transaction.amount)} kr
									</td>
									<td className="w-[110px] px-1.5 md:w-[120px] md:px-2">
										<div className="flex items-center gap-1 md:gap-1.5">
											<div
												className="h-2 w-2 flex-shrink-0 md:h-2.5 md:w-2.5"
												style={{ backgroundColor: transaction.categoryColor }}
											/>
											<span className="truncate text-[10px] text-foreground md:text-[11px]">
												{transaction.category}
											</span>
										</div>
									</td>
								</motion.tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
