"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenuButton } from "./bubble-menu-button";

interface BubbleItemProps {
	action: () => void;
	children: React.ReactNode;
	editor: Editor;
	isActive: boolean;
}

export function BubbleMenuItem({
	editor,
	action,
	isActive,
	children,
}: BubbleItemProps) {
	return (
		<BubbleMenuButton
			action={() => {
				editor.chain().focus();
				action();
			}}
			isActive={isActive}
		>
			{children}
		</BubbleMenuButton>
	);
}
