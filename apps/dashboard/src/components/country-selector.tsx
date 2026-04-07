"use client";

import countryFlags from "@faworra-new/location/country-flags";
import { Button } from "@faworra-new/ui/components/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@faworra-new/ui/components/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@faworra-new/ui/components/popover";
import { cn } from "@faworra-new/ui/lib/utils";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
	className?: string;
	defaultValue: string;
	onSelect: (countryCode: string, countryName: string) => void;
}

export function CountrySelector({ defaultValue, onSelect, className }: Props) {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(defaultValue);

	useEffect(() => {
		if (value !== defaultValue) {
			setValue(defaultValue);
		}
	}, [defaultValue, value]);

	const selected = Object.values(countryFlags).find(
		(country) => country.code === value || country.name === value
	);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className={cn(
						"w-full justify-between truncate font-normal",
						className
					)}
					variant="outline"
				>
					{value ? selected?.name : "Select country"}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="z-[60] min-w-[225px] p-0"
				portal={true}
			>
				<Command loop>
					<CommandInput
						autoComplete="off"
						className="h-9 px-2"
						placeholder="Search country..."
					/>
					<CommandEmpty>No country found.</CommandEmpty>
					<CommandGroup>
						<CommandList className="max-h-[230px] overflow-y-auto pt-2">
							{Object.values(countryFlags).map((country) => (
								<CommandItem
									key={country.code}
									onSelect={() => {
										setValue(country.code);
										onSelect(country.code, country.name);
										setOpen(false);
									}}
									value={country.name}
								>
									{country.name}
									<CheckIcon
										className={cn(
											"ml-auto h-4 w-4",
											value === country.code ? "opacity-100" : "opacity-0"
										)}
									/>
								</CommandItem>
							))}
						</CommandList>
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
