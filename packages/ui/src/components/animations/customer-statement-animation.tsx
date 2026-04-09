"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
	MdOutlineExpandLess,
	MdOutlineExpandMore,
	MdOutlineMoreVert,
} from "react-icons/md";

interface Invoice {
	amount: string;
	date: string;
	dueDate: string;
	id: string;
	invoiceNo: string;
	status: "unpaid" | "overdue" | "paid";
}

const initialInvoices: Invoice[] = [
	{
		id: "1",
		invoiceNo: "INV-0042",
		date: "Mar 15",
		dueDate: "Apr 15",
		amount: "12 450,00 €",
		status: "unpaid",
	},
	{
		id: "2",
		invoiceNo: "INV-0038",
		date: "Feb 10",
		dueDate: "Mar 10",
		amount: "18 750,00 €",
		status: "overdue",
	},
	{
		id: "3",
		invoiceNo: "INV-0035",
		date: "Jan 20",
		dueDate: "Feb 20",
		amount: "22 300,00 €",
		status: "paid",
	},
	{
		id: "4",
		invoiceNo: "INV-0032",
		date: "Dec 15",
		dueDate: "Jan 15",
		amount: "15 600,00 €",
		status: "paid",
	},
	{
		id: "5",
		invoiceNo: "INV-0029",
		date: "Nov 20",
		dueDate: "Dec 20",
		amount: "19 800,00 €",
		status: "paid",
	},
	{
		id: "6",
		invoiceNo: "INV-0026",
		date: "Oct 25",
		dueDate: "Nov 25",
		amount: "14 200,00 €",
		status: "paid",
	},
];

export function CustomerStatementAnimation({
	onComplete,
	shouldPlay = true,
}: {
	onComplete?: () => void;
	shouldPlay?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [showHeader, setShowHeader] = useState(false);
	const [showLogo, setShowLogo] = useState(false);
	const [showGeneral, setShowGeneral] = useState(false);
	const [_showDetails, _setShowDetails] = useState(false);
	const [showStatement, setShowStatement] = useState(false);
	const [showCards, setShowCards] = useState(false);
	const [showTable, setShowTable] = useState(false);
	const [invoices, _setInvoices] = useState<Invoice[]>(initialInvoices);

	useEffect(() => {
		if (!shouldPlay) {
			return;
		}

		const headerTimer = setTimeout(() => {
			setShowHeader(true);
			setShowLogo(true);
		}, 0);
		const generalTimer = setTimeout(() => setShowGeneral(true), 300);
		const statementTimer = setTimeout(() => setShowStatement(true), 600);
		const cardsTimer = setTimeout(() => setShowCards(true), 900);
		const tableTimer = setTimeout(() => setShowTable(true), 1200);

		const doneTimer = onComplete
			? setTimeout(() => {
					onComplete();
				}, 10_000)
			: undefined;

		return () => {
			clearTimeout(headerTimer);
			clearTimeout(generalTimer);
			clearTimeout(statementTimer);
			clearTimeout(cardsTimer);
			clearTimeout(tableTimer);
			if (doneTimer) {
				clearTimeout(doneTimer);
			}
		};
	}, [shouldPlay, onComplete]);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "text-green-500";
			case "overdue":
				return "text-yellow-500";
			default:
				return "text-foreground";
		}
	};

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
					<div className="space-y-2.5 px-2 pt-0 pb-3 md:space-y-3 md:px-3 md:pb-4">
						<div className="text-[10px] text-muted-foreground md:text-[11px]">
							<span className="text-foreground">Contact person:</span> Michael
							Thompson
						</div>
						<div className="text-[10px] text-muted-foreground md:text-[11px]">
							<span className="text-foreground">Email:</span>{" "}
							finance@supabase.com
						</div>
						<div className="text-[10px] text-muted-foreground md:text-[11px]">
							<span className="text-foreground">Website:</span> supabase.com
						</div>
					</div>
				)}
			</motion.div>

			{/* Details Section */}
			<motion.div
				animate={{ opacity: showGeneral ? 1 : 0 }}
				className="border-border border-b"
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

			{/* Statement Section */}
			<motion.div
				animate={{ opacity: showStatement ? 1 : 0 }}
				className="flex min-h-0 flex-1 flex-col overflow-hidden"
				initial={{ opacity: 0 }}
				transition={{ duration: 0.25 }}
			>
				<div className="flex flex-shrink-0 items-center justify-between border-border border-b px-2 py-2.5 md:px-3 md:py-3.5">
					<h3 className="text-[11px] text-foreground md:text-[12px]">
						Statement
					</h3>
					<MdOutlineMoreVert
						className="text-muted-foreground text-sm"
						size={16}
					/>
				</div>

				{/* Summary Cards */}
				{showCards && (
					<div className="grid flex-shrink-0 grid-cols-2 gap-3 pt-4 pb-4 md:gap-4 md:pt-6 md:pb-6">
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="border border-border bg-background p-3 md:p-4"
							initial={{ opacity: 0, y: 6 }}
							transition={{ duration: 0.3 }}
						>
							<div className="mb-1 font-serif text-base text-foreground md:mb-1.5 md:text-lg">
								53 500,00 €
							</div>
							<div className="mb-1 font-sans text-[10px] text-foreground md:mb-1.5 md:text-xs">
								Total Amount
							</div>
						</motion.div>

						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="border border-border bg-background p-3 md:p-4"
							initial={{ opacity: 0, y: 6 }}
							transition={{ duration: 0.3, delay: 0.1 }}
						>
							<div className="mb-1 font-serif text-base text-foreground md:mb-1.5 md:text-lg">
								22 300,00 €
							</div>
							<div className="mb-1 font-sans text-[10px] text-foreground md:mb-1.5 md:text-xs">
								Paid
							</div>
						</motion.div>

						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="border border-border bg-background p-3 md:p-4"
							initial={{ opacity: 0, y: 6 }}
							transition={{ duration: 0.3, delay: 0.2 }}
						>
							<div className="mb-1 font-serif text-base text-foreground md:mb-1.5 md:text-lg">
								31 200,00 €
							</div>
							<div className="mb-1 font-sans text-[10px] text-foreground md:mb-1.5 md:text-xs">
								Outstanding
							</div>
						</motion.div>

						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="border border-border bg-background p-3 md:p-4"
							initial={{ opacity: 0, y: 6 }}
							transition={{ duration: 0.3, delay: 0.3 }}
						>
							<div className="mb-1 font-serif text-base text-foreground md:mb-1.5 md:text-lg">
								3
							</div>
							<div className="mb-1 font-sans text-[10px] text-foreground md:mb-1.5 md:text-xs">
								Invoices
							</div>
						</motion.div>
					</div>
				)}

				{/* Table */}
				{showTable && (
					<motion.div
						animate={{ opacity: 1 }}
						className="relative min-h-0 flex-1 overflow-hidden border border-border bg-background"
						initial={{ opacity: 0 }}
						transition={{ duration: 0.25 }}
					>
						<table
							className="w-full border-collapse"
							style={{ borderSpacing: 0 }}
						>
							<thead className="sticky top-0 z-10 border-border border-b bg-secondary">
								<tr className="h-[28px] md:h-[32px]">
									<th className="w-[90px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[100px] md:px-2 md:text-[11px]">
										Invoice
									</th>
									<th className="w-[70px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[80px] md:px-2 md:text-[11px]">
										Date
									</th>
									<th className="w-[80px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[90px] md:px-2 md:text-[11px]">
										Due Date
									</th>
									<th className="w-[100px] border-border border-r px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[110px] md:px-2 md:text-[11px]">
										Amount
									</th>
									<th className="w-[80px] px-1.5 text-left font-medium text-[10px] text-muted-foreground md:w-[90px] md:px-2 md:text-[11px]">
										Status
									</th>
								</tr>
							</thead>
							<tbody>
								{invoices.map((invoice, index) => (
									<motion.tr
										animate={{
											opacity: showTable ? 1 : 0,
											y: showTable ? 0 : 10,
										}}
										className="h-[28px] border-border border-b bg-background transition-colors hover:bg-secondary md:h-[32px]"
										initial={{ opacity: 0, y: 10 }}
										key={invoice.id}
										transition={{
											duration: 0.3,
											delay: 0.5 + index * 0.08,
											ease: "easeOut",
										}}
									>
										<td className="w-[90px] border-border border-r px-1.5 text-[10px] text-foreground md:w-[100px] md:px-2 md:text-[11px]">
											{invoice.invoiceNo}
										</td>
										<td className="w-[70px] border-border border-r px-1.5 text-[10px] text-muted-foreground md:w-[80px] md:px-2 md:text-[11px]">
											{invoice.date}
										</td>
										<td className="w-[80px] border-border border-r px-1.5 text-[10px] text-muted-foreground md:w-[90px] md:px-2 md:text-[11px]">
											{invoice.dueDate}
										</td>
										<td className="w-[100px] border-border border-r px-1.5 text-[10px] text-foreground md:w-[110px] md:px-2 md:text-[11px]">
											{invoice.amount}
										</td>
										<td className="w-[80px] px-1.5 md:w-[90px] md:px-2">
											<span
												className={`text-[10px] md:text-[11px] ${getStatusColor(invoice.status)}`}
											>
												{invoice.status === "unpaid"
													? "Unpaid"
													: invoice.status === "overdue"
														? "Overdue"
														: "Paid"}
											</span>
										</td>
									</motion.tr>
								))}
							</tbody>
						</table>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
}
