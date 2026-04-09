"use client";

import { format } from "date-fns";
import type React from "react";
import type { DateRange } from "react-day-picker";
import { cn } from "../utils/cn";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Icons } from "./icons";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type Props = {
	date?: Date;
	onSelect: (date?: Date) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
};

export function DatePicker({
	className,
	date,
	disabled,
	onSelect,
	placeholder = "Select date",
}: Props) {
	return (
		<Popover>
			<PopoverTrigger asChild disabled={disabled}>
				<Button
					variant="outline"
					className={cn(
						"w-full justify-start text-left font-normal",
						!date && "text-muted-foreground",
						className,
					)}
				>
					<Icons.CalendarMonth className="mr-2 h-4 w-4" />
					{date ? format(date, "PPP") : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={date}
					onSelect={onSelect}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}

type DateRangePickerProps = {
	range?: DateRange;
	onSelect: (range?: DateRange) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
};

export function DateRangePicker({
	className,
	range,
	disabled,
	onSelect,
	placeholder = "Select date range",
}: DateRangePickerProps) {
	return (
		<div className={cn("grid gap-2", className)}>
			<Popover>
				<PopoverTrigger asChild disabled={disabled}>
					<Button
						variant="outline"
						className={cn("justify-start text-left font-normal space-x-2")}
					>
						<Icons.CalendarMonth className="h-4 w-4" />
						{range?.from ? (
							range.to ? (
								<span>
									{format(range.from, "LLL dd, y")} - {format(range.to, "LLL dd, y")}
								</span>
							) : (
								format(range.from, "LLL dd, y")
							)
						) : (
							<span>{placeholder}</span>
						)}
						<Icons.ChevronDown className="h-4 w-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0 mt-2" align="end">
					<Calendar
						initialFocus
						mode="range"
						defaultMonth={range?.from}
						selected={range}
						onSelect={onSelect}
						numberOfMonths={2}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
