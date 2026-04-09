"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MdCheck, MdSearch } from "react-icons/md";

interface Transaction {
	amount: string;
	checked: boolean;
	date: string;
	description: string;
	id: string;
	status: "none" | "in_review";
}

const initialTransactions: Omit<Transaction, "status" | "checked">[] = [
	{
		id: "1",
		date: "Mar 19",
		description: "Office Supplies Co",
		amount: "-$245.50",
	},
	{
		id: "2",
		date: "Mar 18",
		description: "Cloud Services Inc",
		amount: "-$1,200.00",
	},
	{
		id: "3",
		date: "Mar 17",
		description: "Marketing Agency",
		amount: "-$3,500.00",
	},
	{
		id: "4",
		date: "Mar 16",
		description: "Software License",
		amount: "-$850.75",
	},
	{
		id: "5",
		date: "Mar 15",
		description: "Consulting Services",
		amount: "-$2,100.25",
	},
	{
		id: "6",
		date: "Mar 14",
		description: "Equipment Rental",
		amount: "-$1,750.00",
	},
	{
		id: "7",
		date: "Mar 13",
		description: "Travel Expenses",
		amount: "-$980.50",
	},
	{
		id: "8",
		date: "Mar 12",
		description: "Utilities Payment",
		amount: "-$450.00",
	},
	{
		id: "9",
		date: "Mar 11",
		description: "Office Rent",
		amount: "-$4,200.00",
	},
	{
		id: "10",
		date: "Mar 10",
		description: "Internet Service",
		amount: "-$89.99",
	},
	{
		id: "11",
		date: "Mar 09",
		description: "Phone Service",
		amount: "-$125.00",
	},
	{
		id: "12",
		date: "Mar 08",
		description: "Insurance Premium",
		amount: "-$650.00",
	},
	{
		id: "13",
		date: "Mar 07",
		description: "Legal Services",
		amount: "-$1,500.00",
	},
	{
		id: "14",
		date: "Mar 06",
		description: "Accounting Services",
		amount: "-$800.00",
	},
	{
		id: "15",
		date: "Mar 05",
		description: "Marketing Tools",
		amount: "-$320.50",
	},
	{
		id: "16",
		date: "Mar 04",
		description: "Web Hosting",
		amount: "-$199.99",
	},
	{
		id: "17",
		date: "Mar 03",
		description: "Design Services",
		amount: "-$2,800.00",
	},
	{
		id: "18",
		date: "Mar 02",
		description: "Office Furniture",
		amount: "-$1,450.00",
	},
	{
		id: "19",
		date: "Mar 01",
		description: "Software Subscription",
		amount: "-$299.00",
	},
	{
		id: "20",
		date: "Feb 28",
		description: "Shipping Costs",
		amount: "-$125.50",
	},
	{
		id: "21",
		date: "Feb 27",
		description: "Conference Tickets",
		amount: "-$850.00",
	},
	{
		id: "22",
		date: "Feb 26",
		description: "Printing Services",
		amount: "-$320.00",
	},
];

export function BulkReconciliationAnimation({
	onComplete,
	shouldPlay = true,
}: {
	onComplete?: () => void;
	shouldPlay?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [transactions, setTransactions] = useState<Transaction[]>(
		initialTransactions.map((t) => ({
			...t,
			status: "none" as const,
			checked: false,
		}))
	);
	const [showTable, setShowTable] = useState(false);
	const [showDragdrop, setShowDragdrop] = useState(false);
	const [dragdropPosition, setDragdropPosition] = useState({ x: 0, y: -100 });
	const [isDropping, setIsDropping] = useState(false);
	const [activeTab, setActiveTab] = useState("all");
	const [showActionBar, setShowActionBar] = useState(false);

	const selectedCount = transactions.filter((t) => t.checked).length;
	const inReviewCount = transactions.filter(
		(t) => t.status === "in_review"
	).length;

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		setShowTable(true);

		const dragdropTimer = setTimeout(() => {
			setShowDragdrop(true);
			setTimeout(() => {
				setDragdropPosition({ x: 0, y: 100 });
			}, 100);
			setTimeout(() => {
				setIsDropping(true);
				setDragdropPosition({ x: 0, y: 150 });
			}, 800);
			setTimeout(() => {
				setShowDragdrop(false);
			}, 1200);
		}, 1000);

		const reconcileTimers: NodeJS.Timeout[] = [];
		const checkedIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

		const allInReviewDoneTime = 2200 + 200;

		const reviewTimer = setTimeout(() => {
			setTransactions((prev) =>
				prev.map((t, idx) =>
					idx < 12 ? { ...t, status: "in_review" as const } : t
				)
			);
		}, 2200 + 200);
		reconcileTimers.push(reviewTimer);

		const shuffledIndices = [...checkedIndices].sort(() => Math.random() - 0.5);
		shuffledIndices.forEach((index, checkOrder) => {
			const randomDelay = Math.random() * 300;
			const checkTimer = setTimeout(
				() => {
					setTransactions((prev) => {
						return prev.map((t, idx) =>
							idx === index
								? { ...t, status: "in_review" as const, checked: true }
								: t
						);
					});
				},
				allInReviewDoneTime + 200 + randomDelay + checkOrder * 50
			);
			reconcileTimers.push(checkTimer);
		});

		const maxCheckTime = allInReviewDoneTime + 200 + 300 + 11 * 50;
		const actionBarTimer = setTimeout(() => {
			setShowActionBar(true);
		}, maxCheckTime + 100);
		reconcileTimers.push(actionBarTimer);

		let _done: NodeJS.Timeout | undefined;
		if (onComplete) {
			_done = setTimeout(() => {
				onComplete();
			}, 10_000);
		}

		const doneTimer = onComplete
			? setTimeout(() => {
					onComplete();
				}, 10_000)
			: undefined;

		return () => {
			clearTimeout(dragdropTimer);
			for (const timer of reconcileTimers) {
				clearTimeout(timer);
			}
			if (doneTimer) {
				clearTimeout(doneTimer);
			}
		};
	}, [shouldPlay, onComplete]);

	return (
		<div
			className="relative flex h-full w-full flex-col overflow-hidden border-border border-b"
			ref={containerRef}
		>
			{/* Header */}
			<div className="relative z-10 px-2 pt-1 pb-1.5 md:px-3 md:pt-1.5 md:pb-2">
				<div className="mb-3 flex items-center justify-between md:mb-4">
					<h3 className="text-[13px] text-foreground md:text-[14px]">
						Transactions
					</h3>
				</div>
			</div>

			{/* Search and Tabs Row */}
			<div className="relative z-10 mb-0.5 flex w-full items-center justify-between gap-2">
				<div className="relative max-w-[200px] flex-1 md:max-w-[240px]">
					<input
						className="w-full rounded-none border border-border bg-background px-2 py-1 pr-6 text-[10px] text-foreground placeholder:text-muted-foreground focus:border-border/50 focus:outline-none md:px-3 md:py-1.5 md:pr-7 md:text-[11px]"
						placeholder="Search transactions..."
						type="text"
					/>
					<div className="pointer-events-none absolute top-0 right-1.5 bottom-0 flex items-center md:right-2">
						<MdSearch className="text-muted-foreground" size={12} />
					</div>
				</div>

				<div className="relative flex flex-shrink-0 items-stretch bg-muted">
					<div className="flex items-stretch">
						<button
							className={`group relative flex h-7 touch-manipulation items-center gap-1.5 whitespace-nowrap border px-2 py-1 text-[10px] transition-colors focus:outline-none focus-visible:outline-none md:text-[11px] ${
								activeTab === "all"
									? "border-border bg-background text-foreground"
									: "border-transparent bg-muted text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setActiveTab("all")}
							style={{
								WebkitTapHighlightColor: "transparent",
								marginBottom: activeTab === "all" ? "-1px" : "0px",
								position: "relative",
								zIndex: activeTab === "all" ? 10 : 1,
							}}
							type="button"
						>
							<span>All</span>
						</button>
						<button
							className={`group relative flex h-7 touch-manipulation items-center gap-1.5 whitespace-nowrap border px-2 py-1 text-[10px] transition-colors focus:outline-none focus-visible:outline-none md:text-[11px] ${
								activeTab === "in_review"
									? "border-border bg-background text-foreground"
									: "border-transparent bg-muted text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setActiveTab("in_review")}
							style={{
								WebkitTapHighlightColor: "transparent",
								marginBottom: activeTab === "in_review" ? "-1px" : "0px",
								position: "relative",
								zIndex: activeTab === "in_review" ? 10 : 1,
							}}
							type="button"
						>
							<span>In review ({inReviewCount})</span>
						</button>
					</div>
				</div>
			</div>

			{/* Dragdrop Image */}
			{showDragdrop && (
				<motion.div
					animate={{
						opacity: 1,
						scale: isDropping ? 0.9 : 1,
						x: dragdropPosition.x,
						y: dragdropPosition.y,
					}}
					className="pointer-events-none absolute left-1/2 z-50 -translate-x-1/2"
					exit={{ opacity: 0, scale: 0.8 }}
					initial={{ opacity: 0, scale: 0.8 }}
					style={{ top: "20%" }}
					transition={{
						duration: isDropping ? 0.3 : 0.6,
						ease: isDropping ? "easeIn" : "easeOut",
					}}
				>
					<Image
						alt="Drag and drop"
						className="h-auto w-[100px] object-contain md:w-[120px]"
						height={80}
						src="/images/dragdrop.svg"
						width={120}
					/>
				</motion.div>
			)}

			{/* Table */}
			{showTable && (
				<motion.div
					animate={{ opacity: 1 }}
					className="relative z-0 mt-2 flex min-h-0 flex-1 flex-col overflow-visible border border-border border-b bg-background md:mt-3"
					initial={{ opacity: 0 }}
					transition={{ duration: 0.4 }}
				>
					<div className="overflow-visible pb-12">
						<table
							className="w-full border-collapse"
							style={{ borderSpacing: 0 }}
						>
							<thead className="sticky top-0 z-10 border-border border-b bg-secondary">
								<tr className="h-[28px] md:h-[32px]">
									<th className="w-[32px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:px-2 md:text-[11px]">
										<div className="flex items-center justify-center" />
									</th>
									<th className="w-[60px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[70px] md:px-2 md:text-[11px]">
										Date
									</th>
									<th className="w-[140px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[180px] md:px-2 md:text-[11px]">
										Description
									</th>
									<th className="w-[90px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[100px] md:px-2 md:text-[11px]">
										Amount
									</th>
									<th className="w-[110px] px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[120px] md:px-2 md:text-[11px]">
										Status
									</th>
								</tr>
							</thead>
							<tbody>
								{transactions.map((transaction, _index) => (
									<tr
										className="h-[28px] border-border border-b bg-background transition-colors hover:bg-secondary md:h-[32px]"
										key={transaction.id}
									>
										<td className="w-[32px] border-border border-r px-1.5 md:px-2">
											<div className="flex h-full items-center justify-center">
												<AnimatePresence mode="wait">
													{transaction.checked ? (
														<motion.div
															animate={{ opacity: 1, scale: 1 }}
															className="flex h-3 w-3 items-center justify-center bg-primary"
															exit={{ opacity: 0, scale: 0.8 }}
															initial={{ opacity: 0, scale: 0.8 }}
															key="checked"
															transition={{ duration: 0.2 }}
														>
															<MdCheck
																className="text-primary-foreground"
																size={10}
															/>
														</motion.div>
													) : (
														<motion.div
															animate={{ opacity: 1 }}
															className="h-3 w-3 border border-border bg-background"
															exit={{ opacity: 0 }}
															initial={{ opacity: 0 }}
															key="unchecked"
															transition={{ duration: 0.2 }}
														/>
													)}
												</AnimatePresence>
											</div>
										</td>
										<td className="w-[60px] border-border border-r px-1.5 text-[10px] text-muted-foreground md:w-[70px] md:px-2 md:text-[11px]">
											{transaction.date}
										</td>
										<td className="w-[140px] border-border border-r px-1.5 text-[10px] text-foreground md:w-[180px] md:px-2 md:text-[11px]">
											<div className="truncate" title={transaction.description}>
												{transaction.description}
											</div>
										</td>
										<td className="w-[90px] border-border border-r px-1.5 text-[10px] text-foreground md:w-[100px] md:px-2 md:text-[11px]">
											{transaction.amount}
										</td>
										<td className="w-[110px] px-1.5 md:w-[120px] md:px-2">
											<div className="flex h-full items-center">
												{transaction.status === "in_review" && (
													<span className="font-sans text-[10px] text-muted-foreground md:text-[11px]">
														In review
													</span>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Action Bar */}
					{showActionBar && selectedCount > 0 && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="pointer-events-auto absolute right-2 bottom-2 left-2 z-30 flex items-center justify-between border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-[7px] md:p-2"
							exit={{ opacity: 0, y: 20 }}
							initial={{ opacity: 0, y: 20 }}
							style={{ transform: "scale(0.9)" }}
							transition={{ duration: 0.3 }}
						>
							<span className="pl-2 font-sans text-[10px] text-muted-foreground md:pl-3 md:text-[11px]">
								{selectedCount} selected
							</span>
							<button
								className="flex items-center gap-1 bg-primary px-2 py-1 text-primary-foreground transition-colors hover:bg-primary/90 md:px-3 md:py-1.5"
								type="button"
							>
								<span className="font-sans text-[10px] md:text-[11px]">
									Export
								</span>
								<Image
									alt="Xero"
									className="h-[10px] w-[10px] object-contain md:h-[12px] md:w-[12px]"
									height={12}
									src="/images/xero.svg"
									width={12}
								/>
							</button>
						</motion.div>
					)}
				</motion.div>
			)}
		</div>
	);
}
