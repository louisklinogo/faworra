"use client";

import { cn } from "@faworra-new/ui/lib/utils";
import {
	type AvatarFallbackProps,
	type AvatarImageProps,
	type AvatarProps,
	Fallback,
	Image,
	Root,
} from "@radix-ui/react-avatar";
import { forwardRef } from "react";

const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
	({ className, ...props }, ref) => (
		<Root
			className={cn(
				"relative flex h-10 w-10 shrink-0 overflow-hidden rounded-none",
				className
			)}
			ref={ref}
			{...props}
		/>
	)
);
Avatar.displayName = "Avatar";

const AvatarFallback = forwardRef<HTMLSpanElement, AvatarFallbackProps>(
	({ className, ...props }, ref) => (
		<Fallback
			className={cn(
				"flex h-full w-full items-center justify-center rounded-none bg-accent",
				className
			)}
			ref={ref}
			{...props}
		/>
	)
);
AvatarFallback.displayName = "AvatarFallback";

const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
	({ className, ...props }, ref) => (
		<Image
			className={cn("aspect-square h-full w-full", className)}
			ref={ref}
			{...props}
		/>
	)
);
AvatarImage.displayName = "AvatarImage";

export { Avatar, AvatarFallback, AvatarImage };
