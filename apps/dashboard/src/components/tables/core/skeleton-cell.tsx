"use client";

import { Skeleton } from "@faworra-new/ui/components/skeleton";
import type { SkeletonType } from "./types";

interface SkeletonCellProps {
	type: SkeletonType;
	width?: string;
}

export function SkeletonCell({ type, width }: SkeletonCellProps) {
	switch (type) {
		case "checkbox":
			return <Skeleton className="h-4 w-4" />;

		case "avatar-text":
			return (
				<div className="flex items-center gap-2">
					<Skeleton className="h-6 w-6 rounded-full" />
					<Skeleton className={cn("h-3.5", width ?? "w-24")} />
				</div>
			);

		case "icon-text":
			return (
				<div className="flex items-center gap-2">
					<Skeleton className="h-4 w-4" />
					<Skeleton className={cn("h-3.5", width ?? "w-20")} />
				</div>
			);

		case "badge":
			return <Skeleton className={cn("h-5 rounded-md", width ?? "w-16")} />;

		case "tags":
			return (
				<div className="flex items-center gap-1">
					<Skeleton className="h-5 w-12 rounded-md" />
					<Skeleton className="h-5 w-8 rounded-md" />
				</div>
			);

		case "icon":
			return <Skeleton className={cn("h-4 w-4", width)} />;

		case "text":
		default:
			return <Skeleton className={cn("h-3.5", width ?? "w-24")} />;
	}
}

import { cn } from "@faworra-new/ui/utils";
