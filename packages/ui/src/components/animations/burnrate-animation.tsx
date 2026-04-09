"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);
	const [isTablet, setIsTablet] = useState(false);

	useEffect(() => {
		const checkSize = () => {
			const width = window.innerWidth;
			setIsMobile(width < 640);
			setIsTablet(width >= 640 && width < 768);
		};
		checkSize();
		window.addEventListener("resize", checkSize);
		return () => window.removeEventListener("resize", checkSize);
	}, []);

	return { isMobile, isTablet };
}

export function BurnrateAnimation({
	onComplete,
	shouldPlay = true,
}: {
	onComplete?: () => void;
	shouldPlay?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const { isMobile, isTablet } = useIsMobile();
	const [showGraph, setShowGraph] = useState(false);
	const [showMetrics, setShowMetrics] = useState(false);
	const [showSummary, setShowSummary] = useState(false);
	const [_pathLength, setPathLength] = useState(0);
	const [areaOpacity, setAreaOpacity] = useState(0);
	const [showAverageLine, setShowAverageLine] = useState(false);

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		const graphTimer = setTimeout(() => setShowGraph(true), 0);

		const doneTimer = onComplete
			? setTimeout(() => {
					onComplete();
				}, 10_000)
			: undefined;

		return () => {
			clearTimeout(graphTimer);
			if (doneTimer) {
				clearTimeout(doneTimer);
			}
		};
	}, [shouldPlay, onComplete]);

	useEffect(() => {
		if (showGraph) {
			setPathLength(1);
			setAreaOpacity(1);
			setTimeout(() => {
				setShowAverageLine(true);
			}, 0);

			const metricsTimer = setTimeout(() => setShowMetrics(true), 900);
			const summaryTimer = setTimeout(() => setShowSummary(true), 1500);
			return () => {
				clearTimeout(metricsTimer);
				clearTimeout(summaryTimer);
			};
		}
	}, [showGraph]);

	const dataPoints = [
		{ month: "Oct", value: 5.0 },
		{ month: "Nov", value: 6.2 },
		{ month: "Dec", value: 3.5 },
		{ month: "Jan", value: 6.8 },
		{ month: "Feb", value: 6.0 },
		{ month: "Mar", value: 7.2 },
		{ month: "Apr", value: 6.5 },
	];

	const maxValue = 15;
	const averageValue = 6;
	const graphWidth = 500;
	const graphHeight = isMobile ? 180 : isTablet ? 240 : 280;
	const paddingLeft = 30;
	const paddingRight = 30;
	const paddingTop = isMobile ? 20 : 30;
	const paddingBottom = isMobile ? 20 : 30;
	const chartWidth = graphWidth - paddingLeft - paddingRight;
	const chartHeight = graphHeight - paddingTop - paddingBottom;

	const points = dataPoints.map((point, idx) => {
		const divisor = dataPoints.length > 1 ? dataPoints.length - 1 : 1;
		const x = paddingLeft + (idx / divisor) * chartWidth;
		const y = paddingTop + chartHeight - (point.value / maxValue) * chartHeight;
		return { x, y, month: point.month, value: point.value };
	});

	const pathData = points.reduce((path, p, idx) => {
		if (idx === 0) {
			return `M ${p.x} ${p.y}`;
		}
		const prevPoint = points[idx - 1];
		const isDipPoint = idx === 2;
		const isBeforeDip = idx === 1;
		const isAfterDip = idx === 3;

		if (isDipPoint || isBeforeDip || isAfterDip) {
			return `${path} L ${p.x} ${p.y}`;
		}
		if (!prevPoint) {
			return path;
		}
		const controlX = (prevPoint.x + p.x) / 2;
		const controlY =
			prevPoint.y < p.y
				? prevPoint.y + (p.y - prevPoint.y) * 0.3
				: prevPoint.y - (prevPoint.y - p.y) * 0.3;
		return `${path} Q ${controlX} ${controlY}, ${p.x} ${p.y}`;
	}, "");

	const lastPoint = points[points.length - 1];
	const firstPoint = points[0];
	const areaPath =
		lastPoint && firstPoint
			? `${pathData} L ${lastPoint.x} ${paddingTop + chartHeight} L ${firstPoint.x} ${paddingTop + chartHeight} Z`
			: "";

	const averageY =
		paddingTop + chartHeight - (averageValue / maxValue) * chartHeight;

	const gridLines = [0, 3, 6, 9, 12, 15].map((value) => {
		const y = paddingTop + chartHeight - (value / maxValue) * chartHeight;
		return { y, value };
	});

	return (
		<div className="relative flex h-full w-full flex-col" ref={containerRef}>
			{/* Header */}
			<div className="border-border border-b px-2 pt-2 pb-1.5 md:px-3 md:pt-3 md:pb-2">
				<div className="flex items-center justify-between">
					<h3 className="font-sans text-[13px] text-foreground md:text-[14px]">
						Monthly Burn Rate
					</h3>
					<div className="flex items-center gap-3 md:gap-4">
						<div className="flex items-center gap-1.5 md:gap-2">
							<div
								className="h-2 w-2 bg-foreground"
								style={{ borderRadius: "0" }}
							/>
							<span className="font-sans text-[8px] text-muted-foreground md:text-[9px]">
								Current
							</span>
						</div>
						<div className="flex items-center gap-1.5 md:gap-2">
							<svg className="overflow-visible" height="2" width="12">
								<line
									stroke="hsl(var(--muted-foreground))"
									strokeDasharray="3 3"
									strokeWidth="1.5"
									x1="0"
									x2="12"
									y1="1"
									y2="1"
								/>
							</svg>
							<span className="font-sans text-[8px] text-muted-foreground md:text-[9px]">
								Average
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="flex flex-1 flex-col overflow-hidden px-2 pt-2 pb-0 md:px-3 md:pt-3 md:pb-1">
				<div className="flex flex-col gap-4 pt-2 md:pt-4">
					{/* Graph Section */}
					<div className="relative flex h-[180px] flex-col border border-border bg-background px-2 sm:h-[240px] md:h-[280px] md:px-4">
						<motion.div
							animate={{ opacity: showGraph ? 1 : 0 }}
							className="absolute inset-0 h-full w-full"
							initial={{ opacity: 0 }}
							transition={{ duration: 0.4 }}
						>
							<svg
								className="overflow-visible"
								height="100%"
								preserveAspectRatio="none"
								viewBox={`0 0 ${graphWidth} ${graphHeight}`}
								width="100%"
							>
								<defs>
									<pattern
										height="8"
										id="burnRatePattern"
										patternUnits="userSpaceOnUse"
										width="8"
										x="0"
										y="0"
									>
										<rect fill="transparent" height="8" width="8" />
										<path
											d="M0,0 L8,8 M-2,6 L6,16 M-4,4 L4,12"
											opacity="0.6"
											stroke="hsl(var(--border))"
											strokeWidth="1.2"
										/>
									</pattern>
								</defs>

								{gridLines.map((grid) => (
									<line
										key={`grid-h-${grid.value}`}
										opacity="0.3"
										stroke="hsl(var(--border))"
										strokeDasharray="3 3"
										strokeWidth="1"
										x1={paddingLeft}
										x2={graphWidth - paddingRight}
										y1={grid.y}
										y2={grid.y}
									/>
								))}

								{points.map((point) => (
									<line
										key={`grid-v-${point.month}`}
										opacity="0.3"
										stroke="hsl(var(--border))"
										strokeDasharray="3 3"
										strokeWidth="1"
										x1={point.x}
										x2={point.x}
										y1={paddingTop}
										y2={graphHeight - paddingBottom}
									/>
								))}

								<motion.line
									animate={{ opacity: showAverageLine ? 1 : 0 }}
									initial={{ opacity: 0 }}
									stroke="hsl(var(--muted-foreground))"
									strokeDasharray="5 5"
									strokeWidth="1.5"
									transition={{ duration: 0.3, delay: 0.8 }}
									x1={paddingLeft}
									x2={graphWidth - paddingRight}
									y1={averageY}
									y2={averageY}
								/>

								{areaPath && (
									<motion.path
										animate={{ opacity: areaOpacity }}
										d={areaPath}
										fill="url(#burnRatePattern)"
										initial={{ opacity: 0 }}
										transition={{ duration: 0.4, delay: 0.6 }}
									/>
								)}

								<path
									d={pathData}
									fill="none"
									stroke="hsl(var(--foreground))"
									strokeLinecap="square"
									strokeLinejoin="miter"
									strokeWidth="2"
								/>
							</svg>
						</motion.div>
					</div>

					{/* Metrics Grid */}
					{showMetrics && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="grid grid-cols-2 gap-2 md:gap-3"
							initial={{ opacity: 0, y: 12 }}
							transition={{ duration: 0.4 }}
						>
							<div className="select-none border border-border bg-background p-2 md:p-3">
								<div className="mb-1 font-sans text-[8px] text-muted-foreground md:text-[9px]">
									Current Monthly Burn
								</div>
								<div className="font-normal font-sans text-[14px] text-foreground md:text-[16px]">
									$7,500
								</div>
								<div className="mt-1 font-sans text-[7px] text-muted-foreground md:text-[8px]">
									+5.6% vs last month
								</div>
							</div>
							<div className="select-none border border-border bg-background p-2 md:p-3">
								<div className="mb-1 font-sans text-[8px] text-muted-foreground md:text-[9px]">
									Runway Remaining
								</div>
								<div className="font-normal font-sans text-[14px] text-foreground md:text-[16px]">
									10.7 months
								</div>
								<div className="mt-1 font-sans text-[7px] text-muted-foreground md:text-[8px]">
									Below recommended 12+ months
								</div>
							</div>
							<div className="select-none border border-border bg-background p-2 md:p-3">
								<div className="mb-1 font-sans text-[8px] text-muted-foreground md:text-[9px]">
									Average Burn Rate
								</div>
								<div className="font-normal font-sans text-[14px] text-foreground md:text-[16px]">
									$6,000
								</div>
								<div className="mt-1 font-sans text-[7px] text-muted-foreground md:text-[8px]">
									Over last 6 months
								</div>
							</div>
							<div className="select-none border border-border bg-background p-2 md:p-3">
								<div className="mb-1 font-sans text-[8px] text-muted-foreground md:text-[9px]">
									Personnel Costs
								</div>
								<div className="font-normal font-sans text-[14px] text-foreground md:text-[16px]">
									65%
								</div>
								<div className="mt-1 font-sans text-[7px] text-muted-foreground md:text-[8px]">
									$4,875 of monthly burn
								</div>
							</div>
						</motion.div>
					)}

					{/* Summary Section */}
					{showSummary && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="select-none border border-border bg-background p-2 md:p-3"
							initial={{ opacity: 0, y: 12 }}
							transition={{ duration: 0.4 }}
						>
							<h3 className="mb-1.5 font-sans text-[9px] text-muted-foreground md:mb-2 md:text-[10px]">
								Summary
							</h3>
							<p className="font-sans text-[9px] text-foreground leading-[13px] md:text-[10px] md:leading-[14px]">
								Burn rate increased 67% over 6 months ($4,500 to $7,500), driven
								by personnel costs (65% of expenses). Current runway of 10.7
								months is below the recommended 12+ months, requiring cost
								optimization or additional funding.
							</p>
						</motion.div>
					)}
				</div>
			</div>
		</div>
	);
}
