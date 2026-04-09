"use client";

import { cn } from "@faworra-new/ui/lib/utils";
import type { Header } from "@tanstack/react-table";

interface ResizeHandleProps<TData> {
	className?: string;
	header: Header<TData, unknown>;
}

export function ResizeHandle<TData>({
	header,
	className,
}: ResizeHandleProps<TData>) {
	if (!header.column.getCanResize()) {
		return null;
	}

	return (
		<div
			className={cn(
				"absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none",
				"bg-transparent",
				className
			)}
			onDoubleClick={() => header.column.resetSize()}
			onMouseDown={(e) => {
				e.stopPropagation(); // Prevent drag from triggering
				header.getResizeHandler()(e);
			}}
			onPointerDown={(e) => e.stopPropagation()} // Stop dnd-kit from capturing
			onTouchStart={(e) => {
				e.stopPropagation(); // Prevent drag from triggering
				header.getResizeHandler()(e);
			}}
			style={{
				transform: "translateX(50%)",
			}}
		/>
	);
}
