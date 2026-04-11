"use client";

import { Button } from "@faworra-new/ui/components/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@faworra-new/ui/components/popover";
import { COLORS } from "@/utils/categories";

type Props = {
	value: string;
	onSelect: (value: string) => void;
};

export function ColorPicker({ value, onSelect }: Props) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					className="absolute top-2.5 left-1 size-3.5 rounded-full p-0 hover:bg-transparent"
					style={{ backgroundColor: value }}
					type="button"
					variant="ghost"
				/>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-2" sideOffset={14}>
				<div className="grid grid-cols-6 gap-1">
					{COLORS.map((color) => (
						<Button
							className="size-5 rounded-sm p-0 transition-transform hover:scale-110"
							key={color}
							onClick={() => onSelect(color)}
							style={{ backgroundColor: color }}
							type="button"
							variant="ghost"
						/>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
