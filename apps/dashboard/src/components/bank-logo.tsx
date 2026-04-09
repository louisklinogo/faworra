"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@faworra-new/ui/components/avatar";
import { cn } from "@faworra-new/ui/lib/utils";
import { useState } from "react";

type Props = {
	src: string | null;
	alt: string;
	size?: number;
};

export function BankLogo({ src, alt, size = 34 }: Props) {
	const [hasError, setHasError] = useState(false);
	const showingFallback = !src || hasError;

	return (
		<Avatar
			className={cn(!showingFallback && "border border-border")}
			style={{ width: size, height: size }}
		>
			{src && !hasError ? (
				<AvatarImage
					alt={alt}
					className="bg-white object-contain"
					onError={() => setHasError(true)}
					src={src}
				/>
			) : (
				<AvatarImage
					alt={alt}
					className="object-contain"
					src="https://cdn-engine.midday.ai/default.jpg"
				/>
			)}
			<AvatarFallback>
				<AvatarImage
					alt={alt}
					className="object-contain"
					src="https://cdn-engine.midday.ai/default.jpg"
				/>
			</AvatarFallback>
		</Avatar>
	);
}
