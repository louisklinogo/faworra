import { cn } from "@faworra-new/ui/lib/utils";
import type * as React from "react";

function Label({
	children,
	className,
	htmlFor,
	...props
}: React.ComponentProps<"label">) {
	return (
		<label
			className={cn(
				"font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
				className
			)}
			data-slot="label"
			htmlFor={htmlFor}
			{...props}
		>
			{children}
		</label>
	);
}

export { Label };
