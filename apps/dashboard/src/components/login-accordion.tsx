"use client";

import { useState } from "react";

export function LoginAccordion({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="w-full">
			<button
				className="w-full border border-border bg-[#0e0e0e] px-4 py-3 font-sans text-sm text-white transition-colors hover:bg-[#1a1a1a] dark:bg-[#131313] dark:text-foreground dark:hover:bg-border/50"
				onClick={() => setIsOpen((current) => !current)}
				type="button"
			>
				{isOpen ? "Hide other options" : "Show other options"}
			</button>

			{isOpen ? <div className="space-y-3 pt-4">{children}</div> : null}
		</div>
	);
}
