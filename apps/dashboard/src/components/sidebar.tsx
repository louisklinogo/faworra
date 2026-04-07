"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Icons } from "@faworra-new/ui/components/icons";
import { Skeleton } from "@faworra-new/ui/components/skeleton";
import { cn } from "@faworra-new/ui/lib/utils";
import React, { Suspense, useState } from "react";
import { MainMenu } from "./main-menu";
import { TeamDropdown } from "./team-dropdown";
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
				"fixed top-0 left-0 z-50 hidden h-screen flex-col border-border border-r bg-background transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] md:flex rounded-none",
				isExpanded ? "w-[240px]" : "w-[70px]"
			)}
			onMouseEnter={() => setIsExpanded(true)}
			onMouseLeave={() => setIsExpanded(false)}
		>
			<div
				className={cn(
					"h-[70px] flex items-center bg-background border-b border-border transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] relative",
					isExpanded ? "w-full" : "w-[69px]"
				)}
			>
				<div className="absolute left-[22px] transition-none text-black dark:text-white">
					<Icons.LogoSmall />
				</div>
			</div>

			<div className="flex w-full flex-1 flex-col overflow-y-auto overflow-x-hidden border-b border-border mb-3">
				<div
					className={cn(
						"px-2 py-3 transition-all mt-2",
						isExpanded ? "px-[15px]" : "px-0 flex justify-center"
					)}
				>
					<Button
						className={cn(
							"h-[40px] w-full justify-start gap-3 px-3 text-[#707070] dark:text-[#666666] hover:text-primary dark:hover:text-white bg-[#f7f7f7]/50 dark:bg-[#131313]/50 transition-all border border-[#e6e6e6] dark:border-[#1d1d1d] rounded-none",
							!isExpanded && "w-[40px] px-0 justify-center"
						)}
						variant="ghost"
					>
						<Icons.Search size={20} />
						{isExpanded && <span className="text-sm font-medium">Search</span>}
					</Button>
				</div>

				<MainMenu isExpanded={isExpanded} />
			</div>

			<div className="pb-4 pt-2">
				<UserMenu isExpanded={isExpanded} />
			</div>
		</aside>
	);
}
