"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Icons } from "@faworra-new/ui/components/icons";
import { Skeleton } from "@faworra-new/ui/components/skeleton";
import { cn } from "@faworra-new/ui/lib/utils";
import { useState } from "react";
import { MainMenu } from "./main-menu";
import UserMenu from "./user-menu";

function TeamDropdownSkeleton() {
	return (
		<div className="px-2 py-4">
			<Skeleton className="h-8 w-full rounded-none" />
		</div>
	);
}

export function Sidebar() {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<aside
			className={cn(
				"fixed top-0 left-0 z-50 hidden h-screen flex-col rounded-none border-border border-r bg-background transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] md:flex",
				isExpanded ? "w-[240px]" : "w-[70px]"
			)}
			onMouseEnter={() => setIsExpanded(true)}
			onMouseLeave={() => setIsExpanded(false)}
		>
			<div
				className={cn(
					"relative flex h-[70px] items-center border-border border-b bg-background transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
					isExpanded ? "w-full" : "w-[69px]"
				)}
			>
				<div className="absolute left-[22px] text-black transition-none dark:text-white">
					<Icons.LogoSmall />
				</div>
			</div>

			<div className="mb-3 flex w-full flex-1 flex-col overflow-y-auto overflow-x-hidden border-border border-b">
				<div
					className={cn(
						"mt-2 px-2 py-3 transition-all",
						isExpanded ? "px-[15px]" : "flex justify-center px-0"
					)}
				>
					<Button
						className={cn(
							"h-[40px] w-full justify-start gap-3 rounded-none border border-[#e6e6e6] bg-[#f7f7f7]/50 px-3 text-[#707070] transition-all hover:text-primary dark:border-[#1d1d1d] dark:bg-[#131313]/50 dark:text-[#666666] dark:hover:text-white",
							!isExpanded && "w-[40px] justify-center px-0"
						)}
						variant="ghost"
					>
						<Icons.Search size={20} />
						{isExpanded && <span className="font-medium text-sm">Search</span>}
					</Button>
				</div>

				<MainMenu isExpanded={isExpanded} />
			</div>

			<div className="pt-2 pb-4">
				<UserMenu isExpanded={isExpanded} />
			</div>
		</aside>
	);
}
