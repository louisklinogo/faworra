"use client";

import { cn } from "@faworra-new/ui/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import {
	type ComponentPropsWithoutRef,
	type ElementRef,
	forwardRef,
} from "react";

const Command = forwardRef<
	ElementRef<typeof CommandPrimitive>,
	ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
	<CommandPrimitive
		className={cn(
			"flex h-full w-full flex-col overflow-hidden text-popover-foreground",
			className
		)}
		ref={ref}
		{...props}
	/>
));
Command.displayName = CommandPrimitive.displayName;

const CommandInput = forwardRef<
	ElementRef<typeof CommandPrimitive.Input>,
	ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
	<div className="flex w-full items-center" cmdk-input-wrapper="">
		<CommandPrimitive.Input
			className={cn(
				"flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
				className
			)}
			ref={ref}
			{...props}
		/>
	</div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = forwardRef<
	ElementRef<typeof CommandPrimitive.List>,
	ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.List
		className={cn(
			"max-h-[350px] w-full overflow-y-auto overflow-x-hidden",
			className
		)}
		ref={ref}
		{...props}
	/>
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = forwardRef<
	ElementRef<typeof CommandPrimitive.Empty>,
	ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
	<CommandPrimitive.Empty
		className="py-6 text-center text-sm"
		ref={ref}
		{...props}
	/>
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = forwardRef<
	ElementRef<typeof CommandPrimitive.Group>,
	ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Group
		className={cn(
			"overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-muted-foreground",
			className
		)}
		ref={ref}
		{...props}
	/>
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = forwardRef<
	ElementRef<typeof CommandPrimitive.Item>,
	ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Item
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground",
			className
		)}
		ref={ref}
		{...props}
	/>
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
};
