"use client";

import { format } from "date-fns";
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
					className={cn(
						"w-full justify-start text-left font-normal",
						!date && "text-muted-foreground",
						className
					)}
					variant="outline"
				>
					<Icons.CalendarMonth className="mr-2 h-4 w-4" />
					{date ? format(date, "PPP") : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto p-0">
				<Calendar
					initialFocus
					mode="single"
					onSelect={onSelect}
					selected={date}
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
						className={cn("justify-start space-x-2 text-left font-normal")}
						variant="outline"
					>
						<Icons.CalendarMonth className="h-4 w-4" />
						{range?.from ? (
							range.to ? (
								<span>
									{format(range.from, "LLL dd, y")} -{" "}
									{format(range.to, "LLL dd, y")}
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
				<PopoverContent align="end" className="mt-2 w-auto p-0">
					<Calendar
						defaultMonth={range?.from}
						initialFocus
						mode="range"
						numberOfMonths={2}
						onSelect={onSelect}
						selected={range}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
