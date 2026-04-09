"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@faworra-new/ui/components/popover";
import { useState } from "react";
import { Category } from "@/components/category";
import { SelectCategory } from "@/components/select-category";

type Selected = {
	id: string;
	name: string;
	color?: string | null;
	slug: string | null;
	children?: Selected[];
};

type Props = {
	selected?: Selected;
	onChange: (selected: Selected) => void;
};

export function InlineSelectCategory({ selected, onChange }: Props) {
	const [open, setOpen] = useState(false);

	const handleSelect = (category: Selected) => {
		onChange(category);
		setOpen(false);
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<button
					className="w-full text-left transition-opacity hover:opacity-70"
					onClick={(e) => {
						e.stopPropagation();
					}}
					type="button"
				>
					<Category color={selected?.color ?? ""} name={selected?.name ?? ""} />
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="p-0"
				onClick={(e) => {
					e.stopPropagation();
				}}
				side="bottom"
			>
				<div className="h-[270px] w-[286px]">
					<SelectCategory
						headless
						onChange={handleSelect}
						selected={selected}
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}
