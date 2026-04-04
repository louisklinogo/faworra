"use client";

import countryFlags from "@faworra-new/api/country-flags";
import { Select as SelectPrimitive } from "@faworra-new/ui/components/select";
import { cn } from "@faworra-new/ui/lib/utils";
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

const countries = Object.values(countryFlags);

interface Props {
	className?: string;
	defaultValue: string;
	onSelect: (countryCode: string, countryName: string) => void;
}

export function CountrySelector({ defaultValue, onSelect, className }: Props) {
	const [searchQuery, setSearchQuery] = useState("");
	const [value, setValue] = useState(defaultValue);

	useEffect(() => {
		if (value !== defaultValue) {
			setValue(defaultValue);
		}
	}, [defaultValue, value]);

	const filtered = searchQuery
		? countries.filter((c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: countries;

	const selectedCountry = countries.find((c) => c.code === value);

	return (
		<SelectPrimitive.Root
			onValueChange={(code: unknown) => {
				if (typeof code !== "string") {
					return;
				}
				setValue(code);
				const country = countryFlags[code as keyof typeof countryFlags];
				onSelect(code, country?.name ?? "");
				setSearchQuery("");
			}}
			value={value}
		>
			<SelectPrimitive.Trigger
				className={cn(
					"flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
					className
				)}
			>
				<span className="truncate">
					{selectedCountry ? selectedCountry.name : "Select country"}
				</span>
				<ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
			</SelectPrimitive.Trigger>

			<SelectPrimitive.Portal>
				<SelectPrimitive.Positioner
					align="start"
					className="isolate z-50 outline-none"
					side="bottom"
					sideOffset={4}
				>
					<SelectPrimitive.Popup
						className={cn(
							"z-50 w-(--available-width) min-w-[225px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
							"data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
							"data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95",
							"duration-100 data-closed:animate-out data-open:animate-in"
						)}
					>
						<div className="flex items-center border-b px-3 py-1">
							<SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
							<input
								autoComplete="off"
								className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search country..."
								type="search"
								value={searchQuery}
							/>
						</div>
						<SelectPrimitive.List className="max-h-56 overflow-y-auto overflow-x-hidden p-1">
							{filtered.length === 0 && (
								<div className="py-6 text-center text-muted-foreground text-sm">
									No country found.
								</div>
							)}
							{filtered.map((country) => (
								<SelectPrimitive.Item
									className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-50"
									key={country.code}
									label={country.name}
									value={country.code}
								>
									<SelectPrimitive.ItemText>
										{country.name}
									</SelectPrimitive.ItemText>
									<SelectPrimitive.ItemIndicator className="ml-auto flex items-center">
										<CheckIcon className="h-4 w-4" />
									</SelectPrimitive.ItemIndicator>
								</SelectPrimitive.Item>
							))}
						</SelectPrimitive.List>
					</SelectPrimitive.Popup>
				</SelectPrimitive.Positioner>
			</SelectPrimitive.Portal>
		</SelectPrimitive.Root>
	);
}
