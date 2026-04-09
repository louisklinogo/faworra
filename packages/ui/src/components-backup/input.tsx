import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@faworra-new/ui/lib/utils";
import type * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			className={cn(
				"[&:-webkit-autofill]:!bg-transparent [&:-webkit-autofill]:!bg-none [&:-webkit-autofill]:!shadow-none flex h-9 w-full border bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
				className
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	);
}

export { Input };
