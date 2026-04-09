"use client";

import { type ReactNode, useRef } from "react";

interface TransactionsUploadZoneProps {
	children: ReactNode;
}

export function TransactionsUploadZone({ children }: TransactionsUploadZoneProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="relative h-full">
			<input
				id="upload-transaction-files"
				ref={inputRef}
				className="sr-only"
				multiple
				type="file"
			/>
			{children}
		</div>
	);
}
