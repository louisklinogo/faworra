import { cn } from "@faworra-new/ui/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

const Separator = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }
>(({ className, orientation = "horizontal", ...props }, ref) => (
	<div
		className={cn(
			"shrink-0 bg-border",
			orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
			className
		)}
		ref={ref}
		{...props}
	/>
));
Separator.displayName = "Separator";

export { Separator };
