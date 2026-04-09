"use client";

import { cn } from "@faworra-new/ui/lib/utils";

type CategoryIconProps = {
	className?: string;
	color?: string;
	size?: number;
};

export function CategoryColor({ color, className, size = 12 }: CategoryIconProps) {
	return (
		<div
			className={cn("flex-shrink-0", className)}
			style={{
				backgroundColor: color,
				width: size,
				height: size,
			}}
		/>
	);
}

type Props = {
	className?: string;
	color?: string;
	name: string;
};

export function Category({ name, color, className }: Props) {
	return (
		<div
			className={cn(
				"flex items-center space-x-2 min-w-0 overflow-hidden",
				className,
			)}
		>
			<CategoryColor color={color} />
			{name && <span className="truncate">{name}</span>}
		</div>
	);
}
