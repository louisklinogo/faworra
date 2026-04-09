"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@faworra-new/ui/components/tooltip";

type Props = {
	rawStatus?: string | null;
	hasAttachment?: boolean;
};

export function TransactionStatus({ rawStatus, hasAttachment }: Props) {
	if (rawStatus === "archived") {
		return <span className="cursor-default text-[#878787]">Archived</span>;
	}

	if (rawStatus === "excluded") {
		return <span className="cursor-default text-[#878787]">Excluded</span>;
	}

	if (hasAttachment) {
		return (
			<TooltipProvider delayDuration={0}>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="cursor-default">Receipt attached</span>
					</TooltipTrigger>
					<TooltipContent className="text-xs" sideOffset={10}>
						<p>Receipt attached to transaction</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	if (rawStatus === "pending") {
		return (
			<TooltipProvider delayDuration={0}>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="cursor-default text-[#ff9800]">Pending</span>
					</TooltipTrigger>
					<TooltipContent className="text-xs" sideOffset={10}>
						<p>Transaction needs review</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	if (rawStatus === "posted") {
		return (
			<TooltipProvider delayDuration={0}>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="cursor-default text-[#00D084]">Posted</span>
					</TooltipTrigger>
					<TooltipContent className="text-xs" sideOffset={10}>
						<p>Transaction is posted</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return <span className="cursor-default text-[#878787]">No receipt</span>;
}
