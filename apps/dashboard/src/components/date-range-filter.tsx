"use client";

import { Calendar } from "@faworra-new/ui/components/calendar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@faworra-new/ui/components/select";
import { formatISO, parseISO } from "date-fns";
import { type DatePresetOption, getDatePresets } from "@/utils/date-presets";

interface DateRangeFilterProps {
	end: string | null | undefined;
	onSelect: (range: { start: string | null; end: string | null }) => void;
	presets?: DatePresetOption[];
	start: string | null | undefined;
}

/**
 * Date range filter with accounting-focused presets.
 * Adapted from Midday's date-range-filter.tsx for parity.
 *
 * Deviation: Removed useUserQuery dependency - uses default weekStartsOn (Monday).
 * Midday uses user preferences for weekStartsOn; Faworra defaults to Monday (1).
 * This deviation reduces API calls and simplifies initial implementation.
 * TODO: Add user preference when user settings UI is implemented.
 */
export function DateRangeFilter({
	start,
	end,
	onSelect,
	presets: customPresets,
}: DateRangeFilterProps) {
	const presets = customPresets ?? getDatePresets();

	// Default to Monday (1) - common for business contexts
	// 0 = Sunday, 1 = Monday
	const weekStartsOn = 1;

	return (
		<div className="flex flex-col">
			<div className="border-border border-b p-2">
				<Select
					onValueChange={(value) => {
						const preset = presets.find((p) => p.value === value);
						if (preset?.dateRange.from && preset.dateRange.to) {
							onSelect({
								start: formatISO(preset.dateRange.from, {
									representation: "date",
								}),
								end: formatISO(preset.dateRange.to, {
									representation: "date",
								}),
							});
						}
					}}
				>
					<SelectTrigger className="h-8 w-full text-xs">
						<SelectValue placeholder="Select preset" />
					</SelectTrigger>
					<SelectContent>
						{presets.map((preset) => (
							<SelectItem
								className="text-xs"
								key={preset.value}
								value={preset.value}
							>
								{preset.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<Calendar
				defaultMonth={new Date()}
				initialFocus
				mode="range"
				numberOfMonths={2}
				onSelect={(range) => {
					if (!range) {
						return;
					}

					onSelect({
						start: range.from
							? formatISO(range.from, { representation: "date" })
							: null,
						end: range.to
							? formatISO(range.to, { representation: "date" })
							: null,
					});
				}}
				selected={{
					from: start ? parseISO(start) : undefined,
					to: end ? parseISO(end) : undefined,
				}}
				toDate={new Date()}
				today={new Date()}
				weekStartsOn={weekStartsOn}
			/>
		</div>
	);
}
