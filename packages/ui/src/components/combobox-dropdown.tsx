"use client";

import { cn } from "@faworra-new/ui/lib/utils";
import { CommandList } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";

import { Button } from "./button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface ComboboxItem {
	disabled?: boolean;
	id: string;
	label: string;
	value?: string;
}

interface ComboboxDropdownProps<T extends ComboboxItem> {
	className?: string;
	disabled?: boolean;
	emptyResults?: ReactNode;
	headless?: boolean;
	items: T[];
	listClassName?: string;
	modal?: boolean;
	onCreate?: (value: string) => void;
	onSelect: (item: T) => void;
	placeholder?: ReactNode;
	popoverProps?: ComponentProps<typeof PopoverContent>;
	renderListItem?: (listItem: { isChecked: boolean; item: T }) => ReactNode;
	renderOnCreate?: (value: string) => ReactNode;
	renderSelectedItem?: (selectedItem: T) => ReactNode;
	searchPlaceholder?: string;
	selectedItem?: T;
	triggerClassName?: string;
}

export function ComboboxDropdown<T extends ComboboxItem>({
	className,
	disabled,
	emptyResults,
	headless,
	items,
	listClassName,
	modal = true,
	onCreate,
	onSelect,
	placeholder,
	popoverProps,
	renderListItem,
	renderOnCreate,
	renderSelectedItem = (item) => item.label,
	searchPlaceholder,
	selectedItem: incomingSelectedItem,
	triggerClassName,
}: ComboboxDropdownProps<T>) {
	const [open, setOpen] = useState(false);
	const [internalSelectedItem, setInternalSelectedItem] = useState<
		T | undefined
	>();
	const [inputValue, setInputValue] = useState("");

	const selectedItem = incomingSelectedItem ?? internalSelectedItem;
	const filteredItems = items.filter((item) =>
		item.label.toLowerCase().includes(inputValue.toLowerCase())
	);
	const showCreate = onCreate && Boolean(inputValue) && !filteredItems.length;

	const component = (
		<Command loop shouldFilter={false}>
			<CommandInput
				className="px-3"
				onValueChange={setInputValue}
				placeholder={searchPlaceholder ?? "Search item..."}
				value={inputValue}
			/>

			<CommandGroup>
				<CommandList
					className={cn("max-h-[225px] overflow-auto", listClassName)}
				>
					{filteredItems.map((item) => {
						const isChecked = selectedItem?.id === item.id;

						return (
							<CommandItem
								className={cn("cursor-pointer", className)}
								disabled={item.disabled}
								key={item.id}
								onSelect={(id: string) => {
									const foundItem = items.find(
										(currentItem) => currentItem.id === id
									);

									if (!foundItem) {
										return;
									}

									onSelect(foundItem);
									setInternalSelectedItem(foundItem);
									setOpen(false);
								}}
								value={item.id}
							>
								{renderListItem ? (
									renderListItem({ isChecked, item })
								) : (
									<>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												isChecked ? "opacity-100" : "opacity-0"
											)}
										/>
										{item.label}
									</>
								)}
							</CommandItem>
						);
					})}

					<CommandEmpty>{emptyResults ?? "No item found"}</CommandEmpty>

					{showCreate ? (
						<CommandItem
							key={inputValue}
							onMouseDown={(event) => {
								event.preventDefault();
								event.stopPropagation();
							}}
							onSelect={() => {
								onCreate(inputValue);
								setOpen(false);
								setInputValue("");
							}}
							value={inputValue}
						>
							{renderOnCreate ? renderOnCreate(inputValue) : null}
						</CommandItem>
					) : null}
				</CommandList>
			</CommandGroup>
		</Command>
	);

	if (headless) {
		return component;
	}

	return (
		<Popover modal={modal} onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild className="w-full" disabled={disabled}>
				<Button
					aria-expanded={open}
					className={cn(
						"relative w-full justify-between font-normal",
						triggerClassName
					)}
					variant="outline"
				>
					<span className="block truncate text-ellipsis pr-3">
						{selectedItem
							? renderSelectedItem(selectedItem)
							: (placeholder ?? "Select item...")}
					</span>
					<ChevronsUpDown className="absolute right-2 size-4 opacity-50" />
				</Button>
			</PopoverTrigger>

			<PopoverContent
				{...popoverProps}
				className={cn("p-0", popoverProps?.className)}
				style={{
					width: "var(--radix-popover-trigger-width)",
					...popoverProps?.style,
				}}
			>
				{component}
			</PopoverContent>
		</Popover>
	);
}
