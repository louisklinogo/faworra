"use client";

import { X } from "lucide-react";
import * as React from "react";
import { cn, isValidEmail, parseEmailList } from "../utils";
import { Badge } from "./badge";

export interface EmailTagInputProps {
	className?: string;
	disabled?: boolean;
	onChange?: (value: string | null) => void;
	placeholder?: string;
	value?: string | null;
}

export function EmailTagInput({
	value,
	onChange,
	placeholder = "Add email...",
	disabled,
	className,
}: EmailTagInputProps) {
	const [inputValue, setInputValue] = React.useState("");
	const inputRef = React.useRef<HTMLInputElement>(null);

	// Parse comma-separated emails from value
	const emails = React.useMemo(() => parseEmailList(value), [value]);

	const updateEmails = (newEmails: string[]) => {
		onChange?.(newEmails.length > 0 ? newEmails.join(", ") : null);
	};

	const addEmail = (email: string) => {
		const trimmed = email.trim().toLowerCase();
		if (!trimmed) {
			return;
		}

		// Check if valid email
		if (!isValidEmail(trimmed)) {
			return;
		}

		// Check for duplicates
		if (emails.some((e) => e.toLowerCase() === trimmed)) {
			return;
		}

		updateEmails([...emails, trimmed]);
		setInputValue("");
	};

	const removeEmail = (emailToRemove: string) => {
		updateEmails(emails.filter((e) => e !== emailToRemove));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addEmail(inputValue);
		} else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
			removeEmail(emails[emails.length - 1]!);
		}
	};

	const handleBlur = () => {
		if (inputValue) {
			addEmail(inputValue);
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pastedText = e.clipboardData.getData("text");
		const pastedEmails = pastedText
			.split(/[,;\s]+/)
			.map((e) => e.trim().toLowerCase())
			.filter((e) => isValidEmail(e));

		if (pastedEmails.length > 0) {
			// Deduplicate within pasted emails and against existing emails
			const seen = new Set(emails.map((e) => e.toLowerCase()));
			const uniqueNewEmails: string[] = [];
			for (const email of pastedEmails) {
				if (!seen.has(email)) {
					seen.add(email);
					uniqueNewEmails.push(email);
				}
			}
			if (uniqueNewEmails.length > 0) {
				updateEmails([...emails, ...uniqueNewEmails]);
			}
		}
	};

	return (
		<div
			className={cn(
				"flex min-h-9 w-full flex-wrap items-center gap-1.5 border bg-transparent px-3 py-1 text-sm transition-colors",
				disabled && "cursor-not-allowed opacity-50",
				className
			)}
			onClick={() => inputRef.current?.focus()}
		>
			{emails.map((email) => (
				<Badge className="flex items-center gap-1" key={email} variant="tag">
					{email}
					{!disabled && (
						<button
							aria-label={`Remove ${email}`}
							className="ml-0.5 outline-none hover:text-primary"
							onClick={(e) => {
								e.stopPropagation();
								removeEmail(email);
							}}
							type="button"
						>
							<X className="size-3" />
						</button>
					)}
				</Badge>
			))}
			<input
				autoComplete="off"
				className="min-w-[120px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
				disabled={disabled}
				onBlur={handleBlur}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
				placeholder={emails.length === 0 ? placeholder : ""}
				ref={inputRef}
				type="email"
				value={inputValue}
			/>
		</div>
	);
}
