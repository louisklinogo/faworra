"use client";

import { cn } from "@faworra-new/ui/lib/utils";
import {
	CheckboxItem,
	Content,
	type DropdownMenuContentProps,
	type DropdownMenuItemProps,
	type DropdownMenuLabelProps,
	type DropdownMenuSeparatorProps,
	type DropdownMenuSubContentProps,
	type DropdownMenuSubTriggerProps,
	Group,
	Item,
	ItemIndicator,
	Label,
	Portal,
	RadioGroup,
	RadioItem,
	Root,
	Separator,
	Sub,
	SubContent,
	SubTrigger,
	Trigger,
} from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { forwardRef, type HTMLAttributes } from "react";

const DropdownMenu = Root;
const DropdownMenuTrigger = Trigger;
const DropdownMenuGroup = Group;
const DropdownMenuPortal = Portal;
const DropdownMenuSub = Sub;
const DropdownMenuRadioGroup = RadioGroup;

const DropdownMenuSubTrigger = forwardRef<
	HTMLDivElement,
	DropdownMenuSubTriggerProps & { inset?: boolean }
>(({ children, className, inset, ...props }, ref) => (
	<SubTrigger
		className={cn(
			"flex cursor-default select-none items-center px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
			inset && "pl-8",
			className
		)}
		ref={ref}
		{...props}
	>
		{children}
		<ChevronRightIcon className="ml-auto h-4 w-4" />
	</SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = forwardRef<
	HTMLDivElement,
	DropdownMenuSubContentProps
>(({ className, ...props }, ref) => (
	<SubContent
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-none border bg-background p-1 text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in",
			className
		)}
		ref={ref}
		{...props}
	/>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

const DropdownMenuContent = forwardRef<
	HTMLDivElement,
	DropdownMenuContentProps & {
		container?: HTMLElement;
		portal?: boolean;
	}
>(({ className, container, portal = true, sideOffset = 4, ...props }, ref) => {
	const content = (
		<Content
			className={cn(
				"z-50 min-w-[8rem] overflow-hidden rounded-none border bg-background p-1 text-popover-foreground shadow-md",
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=open]:animate-in",
				className
			)}
			ref={ref}
			sideOffset={sideOffset}
			{...props}
		/>
	);

	return portal ? <Portal container={container}>{content}</Portal> : content;
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = forwardRef<
	HTMLDivElement,
	DropdownMenuItemProps & { asDialogTrigger?: boolean; inset?: boolean }
>(({ asDialogTrigger, className, inset, ...props }, ref) => (
	<Item
		className={cn(
			"relative flex cursor-default select-none items-center px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			inset && "pl-8",
			className
		)}
		ref={ref}
		{...(asDialogTrigger
			? { onSelect: (event: Event) => event.preventDefault() }
			: {})}
		{...props}
	/>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<typeof CheckboxItem>
>(({ checked, children, className, ...props }, ref) => (
	<CheckboxItem
		checked={checked}
		className={cn(
			"relative flex cursor-default select-none items-center py-1.5 pr-12 pl-4 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			className
		)}
		ref={ref}
		{...props}
	>
		{children}
		<span className="absolute right-2 flex h-2 w-2 items-center justify-center">
			<ItemIndicator>
				<CheckIcon className="h-4 w-4" />
			</ItemIndicator>
		</span>
	</CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuRadioItem = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<typeof RadioItem>
>(({ children, className, ...props }, ref) => (
	<RadioItem
		className={cn(
			"relative flex cursor-default select-none items-center py-1.5 pr-12 pl-4 text-[#666] text-xs outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[state=checked]:text-primary data-[disabled]:opacity-50",
			className
		)}
		ref={ref}
		{...props}
	>
		{children}
		<span className="absolute right-2 flex h-2 w-2 items-center justify-center">
			<ItemIndicator>
				<CheckIcon className="h-4 w-4" />
			</ItemIndicator>
		</span>
	</RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuLabel = forwardRef<
	HTMLDivElement,
	DropdownMenuLabelProps & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
	<Label
		className={cn(
			"px-2 py-1.5 font-semibold text-sm",
			inset && "pl-8",
			className
		)}
		ref={ref}
		{...props}
	/>
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = forwardRef<
	HTMLDivElement,
	DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
	<Separator
		className={cn("-mx-1 my-1 h-px bg-accent", className)}
		ref={ref}
		{...props}
	/>
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = ({
	className,
	...props
}: HTMLAttributes<HTMLSpanElement>) => (
	<span
		className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
		{...props}
	/>
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
};
