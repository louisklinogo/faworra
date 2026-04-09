"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdOutlineFilterList, MdSearch } from "react-icons/md";

export function FileGridAnimation({
	onComplete,
	shouldPlay = true,
	isLightMode = false,
}: {
	onComplete?: () => void;
	shouldPlay?: boolean;
	isLightMode?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [query, setQuery] = useState("");
	const [firstCardLoaded, setFirstCardLoaded] = useState(false);
	const [showCards, setShowCards] = useState(false);

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		const cardsTimer = setTimeout(() => setShowCards(true), 0);
		const contentTimer = setTimeout(() => setFirstCardLoaded(true), 1200);

		const doneTimer = onComplete
			? setTimeout(() => {
					onComplete();
				}, 12_000)
			: undefined;

		return () => {
			clearTimeout(cardsTimer);
			clearTimeout(contentTimer);
			if (doneTimer) {
				clearTimeout(doneTimer);
			}
		};
	}, [shouldPlay, onComplete]);

	const files = [
		{
			id: 1,
			title: "Invoice — Acme Co",
			desc: "Mar 2025 • $3,000",
			description:
				"Final invoice for Q1 development work including 20 hours of backend development and 15 hours of frontend integration.",
			tags: ["invoice", "acme", "paid"],
			icon: "description",
		},
		{
			id: 2,
			title: "Receipt — Figma",
			desc: "Mar 12 • $24.00",
			description:
				"Monthly subscription renewal for design collaboration tools used across all client projects.",
			tags: ["receipt", "design", "subscription"],
			icon: "receipt_long",
		},
		{
			id: 3,
			title: "Proposal — Redstone",
			desc: "Q2 • Draft",
			description:
				"Project proposal for mobile app development including timeline, deliverables, and pricing breakdown.",
			tags: ["proposal", "client"],
			icon: "draft",
		},
		{
			id: 4,
			title: "Timesheet — Sprint 14",
			desc: "42h • Dev/Design",
			description:
				"Weekly timesheet tracking development and design work across multiple client projects.",
			tags: ["timesheet", "hours"],
			icon: "schedule",
		},
		{
			id: 5,
			title: "Contract — NDA",
			desc: "Signed • 2025",
			description:
				"Non-disclosure agreement for confidential client project discussions and proprietary information.",
			tags: ["contract", "legal"],
			icon: "gavel",
		},
		{
			id: 6,
			title: "Report — Q1 Expenses",
			desc: "Auto-generated",
			description:
				"Automated expense report summarizing all business costs, categorized by type and project.",
			tags: ["report", "expenses"],
			icon: "analytics",
		},
	];

	const filtered = files.filter((f) => {
		const q = query.toLowerCase();
		return (
			f.title.toLowerCase().includes(q) ||
			f.desc.toLowerCase().includes(q) ||
			f.description.toLowerCase().includes(q) ||
			f.tags.some((t) => t.toLowerCase().includes(q))
		);
	});

	return (
		<div className="relative flex h-full w-full flex-col" ref={containerRef}>
			<div>
				<div className="mb-2 flex items-center justify-between px-2 pt-2 md:mb-3 md:px-3 md:pt-3">
					<h3 className="text-[13px] text-foreground md:text-[14px]">Files</h3>
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
				<div className="px-2 pb-1.5 md:px-3 md:pb-2">
					<div className="relative">
						<input
							className="w-full rounded-none border border-border bg-background px-2 py-1.5 pr-7 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-border/50 focus:outline-none md:px-3 md:py-2 md:pr-8 md:text-[12px]"
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search files..."
							type="text"
							value={query}
						/>
						<MdSearch
							className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground md:right-3"
							size={14}
						/>
					</div>
				</div>
			</div>

			<div className="mt-2 flex-1 overflow-hidden px-2 pb-2 md:mt-3 md:px-3 md:pb-3">
				<div className="grid h-full grid-cols-2 gap-2 md:gap-3">
					{filtered.slice(0, 6).map((f, idx) => (
						<motion.div
							animate={{ opacity: showCards ? 1 : 0, y: showCards ? 0 : 12 }}
							className="flex h-full min-h-[120px] flex-col gap-1.5 border border-border bg-secondary p-1.5 md:min-h-[140px] md:gap-2 md:p-2 lg:p-3"
							initial={{ opacity: 0, y: 12 }}
							key={f.id}
							transition={{ duration: 0.25, delay: showCards ? idx * 0.08 : 0 }}
						>
							{idx === 0 && !firstCardLoaded ? (
								<>
									<div className="flex flex-col">
										<div className="h-2 w-3/4 animate-pulse rounded-none bg-muted md:h-2.5 lg:h-3" />
										<div className="mt-1.5 h-2 w-1/2 animate-pulse rounded-none bg-muted md:mt-2 md:h-2.5 lg:h-3" />
										<div className="mt-2 h-1.5 w-[95%] animate-pulse rounded-none bg-muted md:mt-2.5 md:h-2 lg:mt-3" />
										<div className="mt-1 h-1.5 w-4/5 animate-pulse rounded-none bg-muted md:h-2" />
										<div className="mt-1 h-1.5 w-3/5 animate-pulse rounded-none bg-muted md:h-2" />
									</div>
									<div className="mt-auto flex flex-wrap items-center gap-1 md:gap-1.5 lg:gap-2">
										<div className="h-3 w-12 animate-pulse rounded-full bg-muted md:h-3.5 md:w-14 lg:h-4 lg:w-16" />
										<div className="h-3 w-10 animate-pulse rounded-full bg-muted md:h-3.5 md:w-12 lg:h-4 lg:w-14" />
										<div className="h-3 w-8 animate-pulse rounded-full bg-muted md:h-3.5 md:w-10 lg:h-4 lg:w-12" />
									</div>
								</>
							) : (
								<>
									<div className="flex flex-col">
										<div className="mb-0.5 text-[10px] text-foreground md:mb-1 md:text-[11px]">
											{f.title}
										</div>
										<div className="mb-1.5 text-[8px] text-muted-foreground md:mb-2 md:text-[9px]">
											{f.desc}
										</div>
										<div className="text-[8px] text-muted-foreground leading-relaxed md:text-[9px]">
											{f.description}
										</div>
									</div>
									<div className="mt-auto flex flex-wrap items-center gap-1">
										{f.tags.slice(0, 2).map((tag) => (
											<div
												className="inline-flex h-3.5 items-center rounded-full border border-border bg-muted px-1 md:h-4 md:px-1.5 dark:border-0"
												key={tag}
											>
												<span className="text-[8px] text-muted-foreground leading-none md:text-[9px]">
													{tag}
												</span>
											</div>
										))}
									</div>
								</>
							)}
						</motion.div>
					))}
				</div>
			</div>
		</div>
	);
}
