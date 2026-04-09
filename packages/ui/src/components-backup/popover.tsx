"use client";

import { cn } from "@faworra-new/ui/lib/utils";
import {
	Content,
	type PopoverContentProps,
	Portal,
	Root,
	Trigger,
} from "@radix-ui/react-popover";
import { forwardRef } from "react";

const Popover = Root;
const PopoverTrigger = Trigger;

const PopoverContent = forwardRef<
	HTMLDivElement,
	PopoverContentProps & {
		portal?: boolean;
	}
>(
	(
		{ align = "center", className, portal = true, sideOffset = 4, ...props },
		ref
	) => {
		const content = (
			<Content
				align={align}
				className={cn(
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 border bg-background p-4 text-popover-foreground shadow-md outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
					className
				)}
				ref={ref}
				sideOffset={sideOffset}
				{...props}
			/>
		);

		return portal ? <Portal>{content}</Portal> : content;
	}
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverContent, PopoverTrigger };
