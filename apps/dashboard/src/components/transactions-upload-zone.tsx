"use client";

import { type ReactNode, useRef } from "react";

interface TransactionsUploadZoneProps {
	children: ReactNode;
}

export function TransactionsUploadZone({
	children,
}: TransactionsUploadZoneProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="relative h-full">
			<input
				className="sr-only"
				id="upload-transaction-files"
				multiple
				ref={inputRef}
				type="file"
			/>
			{children}
		</div>
	);
}
