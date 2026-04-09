"use client";

import { cn } from "@faworra-new/ui/lib/utils";
import {
	Content,
	Group,
	Icon,
	Item,
	ItemIndicator,
	ItemText,
	Label,
	Portal,
	Root,
	ScrollDownButton,
	ScrollUpButton,
	type SelectContentProps,
	type SelectItemProps,
	type SelectLabelProps,
	type SelectSeparatorProps,
	type SelectTriggerProps,
	Separator,
	Trigger,
	Value,
	Viewport,
} from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { forwardRef } from "react";

const Select = Root;
const SelectGroup = Group;
const SelectValue = Value;

const SelectTrigger = forwardRef<
	HTMLButtonElement,
	SelectTriggerProps & {
		hideIcon?: boolean;
	}
>(({ children, className, hideIcon = false, ...props }, ref) => (
	<Trigger
		className={cn(
			"!flex h-9 w-full items-center justify-between whitespace-nowrap border border-border bg-transparent px-3 py-2 font-normal text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
			className
		)}
		ref={ref}
		{...props}
	>
		<span className="line-clamp-1">{children}</span>
		{hideIcon ? null : (
			<div className="h-4 w-4">
				<Icon asChild>
					<ChevronDownIcon className="h-4 w-4" />
				</Icon>
			</div>
		)}
	</Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectScrollUpButton = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<typeof ScrollUpButton>
>(({ className, ...props }, ref) => (
	<ScrollUpButton
		className={cn(
			"flex cursor-default items-center justify-center py-1",
			className
		)}
		ref={ref}
		{...props}
	>
		<ChevronUpIcon />
	</ScrollUpButton>
));
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<typeof ScrollDownButton>
>(({ className, ...props }, ref) => (
	<ScrollDownButton
		className={cn(
			"flex cursor-default items-center justify-center py-1",
			className
		)}
		ref={ref}
		{...props}
	>
		<ChevronDownIcon />
	</ScrollDownButton>
));
SelectScrollDownButton.displayName = "SelectScrollDownButton";

const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
	({ children, className, position = "popper", ...props }, ref) => (
		<Portal>
			<Content
				className={cn(
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden border bg-popover text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in",
					position === "popper"
						? "data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1"
						: undefined,
					className
				)}
				position={position}
				ref={ref}
				{...props}
			>
				<SelectScrollUpButton />
				<Viewport
					className={cn(
						"p-1",
						position === "popper"
							? "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
							: undefined
					)}
				>
					{children}
				</Viewport>
				<SelectScrollDownButton />
			</Content>
		</Portal>
	)
);
SelectContent.displayName = "SelectContent";

const SelectLabel = forwardRef<HTMLDivElement, SelectLabelProps>(
	({ className, ...props }, ref) => (
		<Label
			className={cn("px-2 py-1.5 font-medium text-sm", className)}
			ref={ref}
			{...props}
		/>
	)
);
SelectLabel.displayName = "SelectLabel";

const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
	({ children, className, ...props }, ref) => (
		<Item
			className={cn(
				"relative flex w-full cursor-default select-none items-center py-1.5 pr-8 pl-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className
			)}
			ref={ref}
			{...props}
		>
			<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
				<ItemIndicator>
					<CheckIcon className="h-4 w-4" />
				</ItemIndicator>
			</span>
			<ItemText>{children}</ItemText>
		</Item>
	)
);
SelectItem.displayName = "SelectItem";

const SelectSeparator = forwardRef<HTMLDivElement, SelectSeparatorProps>(
	({ className, ...props }, ref) => (
		<Separator
			className={cn("-mx-1 my-1 h-px bg-muted", className)}
			ref={ref}
			{...props}
		/>
	)
);
SelectSeparator.displayName = "SelectSeparator";

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
