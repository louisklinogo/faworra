"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
	MdOutlineExpandLess,
	MdOutlineExpandMore,
	MdOutlineMoreVert,
} from "react-icons/md";

export function CompanyEnrichmentAnimation({
	onComplete,
	shouldPlay = true,
}: {
	onComplete?: () => void;
	shouldPlay?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [showHeader, setShowHeader] = useState(false);
	const [showLogo, setShowLogo] = useState(false);
	const [showTags, setShowTags] = useState(false);
	const [showGeneral, setShowGeneral] = useState(false);
	const [showCompanyProfile, setShowCompanyProfile] = useState(false);
	const [showDetails, setShowDetails] = useState(false);

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		const headerTimer = setTimeout(() => {
			setShowHeader(true);
			setShowLogo(true);
		}, 0);
		const tagsTimer = setTimeout(() => setShowTags(true), 600);
		const generalTimer = setTimeout(() => setShowGeneral(true), 900);
		const profileTimer = setTimeout(() => setShowCompanyProfile(true), 1200);
		const detailsTimer = setTimeout(() => setShowDetails(true), 1500);

		const doneTimer = onComplete
			? setTimeout(() => {
					onComplete();
				}, 10_000)
			: undefined;

		return () => {
			clearTimeout(headerTimer);
			clearTimeout(tagsTimer);
			clearTimeout(generalTimer);
			clearTimeout(profileTimer);
			clearTimeout(detailsTimer);
			if (doneTimer) {
				clearTimeout(doneTimer);
			}
		};
	}, [shouldPlay, onComplete]);

	return (
		<div
			className="relative flex h-full min-h-0 w-full flex-col bg-background"
			ref={containerRef}
		>
			{/* Header */}
			<motion.div
				animate={{ opacity: showHeader ? 1 : 0 }}
				className="flex items-center justify-between border-border border-b px-2 pt-2 pb-2 md:px-3 md:pt-3 md:pb-3"
				initial={{ opacity: 0 }}
				transition={{ duration: 0.25 }}
			>
				<div className="flex items-center gap-2 md:gap-3">
					<motion.div
						animate={{ opacity: showLogo ? 1 : 0 }}
						className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-foreground/5 md:h-9 md:w-9"
						initial={{ opacity: 0 }}
						transition={{ duration: 0.25 }}
					>
						<Image
							alt="Supabase"
							className="h-full w-full object-contain"
							height={20}
							src="/images/supabase.png"
							width={20}
						/>
					</motion.div>
					<h2 className="font-serif text-[16px] text-foreground md:text-[18px]">
						Supabase
					</h2>
				</div>
				<MdOutlineMoreVert
					className="text-muted-foreground text-sm"
					size={16}
				/>
			</motion.div>

			{/* Description */}
			{showHeader && (
				<motion.div
					animate={{ opacity: 1 }}
					className="px-2 pt-2 pb-1 md:px-3 md:pt-3 md:pb-1.5"
					initial={{ opacity: 0 }}
					transition={{ duration: 0.25, delay: 0.4 }}
				>
					<p className="text-[10px] text-muted-foreground leading-relaxed md:text-[11px]">
						<span className="md:hidden">
							A technology company that provides enterprise cloud solutions and
							data synchronization services for businesses worldwide.
						</span>
						<span className="hidden md:inline">
							A technology company that provides enterprise cloud solutions and
							data synchronization services for businesses worldwide. The
							platform enables seamless data integration across multiple
							systems, offering real-time synchronization, advanced security
							features, and comprehensive analytics for enterprise customers.
						</span>
					</p>
				</motion.div>
			)}

			{/* Tags */}
			{showTags && (
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-wrap gap-1.5 border-border border-b px-2 pt-1 pb-2 md:gap-2 md:px-3 md:pt-1.5 md:pb-3"
					initial={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.3 }}
				>
					<motion.span
						animate={{ opacity: 1, scale: 1 }}
						className="border border-border bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground md:px-2 md:py-1 md:text-[10px]"
						initial={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.2, delay: 0.1 }}
					>
						SaaS
					</motion.span>
					<motion.span
						animate={{ opacity: 1, scale: 1 }}
						className="border border-border bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground md:px-2 md:py-1 md:text-[10px]"
						initial={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.2, delay: 0.2 }}
					>
						Cloud Infrastructure
					</motion.span>
					<motion.span
						animate={{ opacity: 1, scale: 1 }}
						className="border border-border bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground md:px-2 md:py-1 md:text-[10px]"
						initial={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.2, delay: 0.3 }}
					>
						500+ employees
					</motion.span>
					<motion.span
						animate={{ opacity: 1, scale: 1 }}
						className="border border-border bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground md:px-2 md:py-1 md:text-[10px]"
						initial={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.2, delay: 0.4 }}
					>
						Series C
					</motion.span>
				</motion.div>
			)}

			{/* General Section */}
			<motion.div
				animate={{ opacity: showGeneral ? 1 : 0 }}
				className="border-border border-b md:mt-2"
				initial={{ opacity: 0 }}
				transition={{ duration: 0.25 }}
			>
				<div className="flex items-center justify-between px-2 pt-2 pb-3 md:px-3 md:py-5 md:pt-3">
					<h3 className="text-[11px] text-foreground md:text-[12px]">
						General
					</h3>
					<MdOutlineExpandLess
						className="text-muted-foreground text-sm"
						size={16}
					/>
				</div>
				{showGeneral && (
					<motion.div
						animate={{ opacity: 1 }}
						className="space-y-2.5 px-2 pt-0 pb-3 md:space-y-3 md:px-3 md:pb-4"
						initial={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						<motion.div
							animate={{ opacity: 1, x: 0 }}
							className="text-[10px] text-muted-foreground md:text-[11px]"
							initial={{ opacity: 0, x: -10 }}
							transition={{ duration: 0.2, delay: 0.1 }}
						>
							<span className="text-foreground">Contact person:</span> Michael
							Thompson
						</motion.div>
						<motion.div
							animate={{ opacity: 1, x: 0 }}
							className="text-[10px] text-muted-foreground md:text-[11px]"
							initial={{ opacity: 0, x: -10 }}
							transition={{ duration: 0.2, delay: 0.2 }}
						>
							<span className="text-foreground">Email:</span>{" "}
							finance@supabase.com
						</motion.div>
						<motion.div
							animate={{ opacity: 1, x: 0 }}
							className="text-[10px] text-muted-foreground md:text-[11px]"
							initial={{ opacity: 0, x: -10 }}
							transition={{ duration: 0.2, delay: 0.3 }}
						>
							<span className="text-foreground">Website:</span> supabase.com
						</motion.div>
					</motion.div>
				)}
			</motion.div>

			{/* Company Profile Section */}
			<motion.div
				animate={{ opacity: showCompanyProfile ? 1 : 0 }}
				className="flex min-h-0 flex-1 flex-col overflow-y-auto md:mt-2"
				initial={{ opacity: 0 }}
				transition={{ duration: 0.25 }}
			>
				<div className="flex flex-shrink-0 items-center justify-between px-2 pt-2 pb-3 md:px-3 md:py-5 md:pt-3">
					<h3 className="text-[11px] text-foreground md:text-[12px]">
						Company Profile
					</h3>
					<MdOutlineExpandLess
						className="text-muted-foreground text-sm"
						size={16}
					/>
				</div>
				{showCompanyProfile && (
					<motion.div
						animate={{ opacity: 1 }}
						className="flex-1 overflow-y-auto px-2 pt-0 pb-3 md:px-3 md:pb-4"
						initial={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						<div className="grid grid-cols-2 gap-x-4 gap-y-2.5 md:gap-y-3">
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="text-[10px] text-muted-foreground md:text-[11px]"
								initial={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, delay: 0.1 }}
							>
								<span className="text-foreground">Industry:</span> SaaS
							</motion.div>
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="text-[10px] text-muted-foreground md:text-[11px]"
								initial={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, delay: 0.2 }}
							>
								<span className="text-foreground">Company Type:</span> Private
							</motion.div>
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="text-[10px] text-muted-foreground md:text-[11px]"
								initial={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, delay: 0.3 }}
							>
								<span className="text-foreground">Employees:</span> 500+
							</motion.div>
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="text-[10px] text-muted-foreground md:text-[11px]"
								initial={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, delay: 0.4 }}
							>
								<span className="text-foreground">Founded:</span> 2018
							</motion.div>
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="text-[10px] text-muted-foreground md:text-[11px]"
								initial={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, delay: 0.5 }}
							>
								<span className="text-foreground">Funding:</span> Series C
								($125M)
							</motion.div>
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="text-[10px] text-muted-foreground md:text-[11px]"
								initial={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, delay: 0.6 }}
							>
								<span className="text-foreground">Headquarters:</span> San
								Francisco, CA
							</motion.div>
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="text-[10px] text-muted-foreground md:text-[11px]"
								initial={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, delay: 0.7 }}
							>
								<span className="text-foreground">CEO / Founder:</span> David
								Rodriguez
							</motion.div>
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="text-[10px] text-muted-foreground md:text-[11px]"
								initial={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, delay: 0.8 }}
							>
								<span className="text-foreground">Language:</span> English
							</motion.div>
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="text-[10px] text-muted-foreground md:text-[11px]"
								initial={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, delay: 0.9 }}
							>
								<span className="text-foreground">Fiscal Year End:</span>{" "}
								December
							</motion.div>
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="text-[10px] text-muted-foreground md:text-[11px]"
								initial={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, delay: 1.0 }}
							>
								<span className="text-foreground">Local Time:</span> 09:15 (PST)
							</motion.div>
						</div>
					</motion.div>
				)}
			</motion.div>

			{/* Details Section */}
			<motion.div
				animate={{ opacity: showDetails ? 1 : 0 }}
				className="border-border border-t"
				initial={{ opacity: 0 }}
				transition={{ duration: 0.25 }}
			>
				<div className="flex items-center justify-between px-2 py-2.5 md:px-3 md:py-3.5">
					<h3 className="text-[11px] text-foreground md:text-[12px]">
						Details
					</h3>
					<MdOutlineExpandMore
						className="text-muted-foreground text-sm"
						size={16}
					/>
				</div>
			</motion.div>
		</div>
	);
}
