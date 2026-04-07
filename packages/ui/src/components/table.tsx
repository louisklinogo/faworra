import { cn } from "@faworra-new/ui/lib/utils";
import {
	forwardRef,
	type HTMLAttributes,
	type TdHTMLAttributes,
	type ThHTMLAttributes,
} from "react";

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
	({ className, ...props }, ref) => (
		<table
			className={cn("w-full caption-bottom text-sm", className)}
			ref={ref}
			{...props}
		/>
	)
);
Table.displayName = "Table";

const TableHeader = forwardRef<
	HTMLTableSectionElement,
	HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead
		className={cn("border [&_tr]:border-b", className)}
		ref={ref}
		{...props}
	/>
));
TableHeader.displayName = "TableHeader";

const TableBody = forwardRef<
	HTMLTableSectionElement,
	HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody
		className={cn("border [&_tr:last-child]:border-0", className)}
		ref={ref}
		{...props}
	/>
));
TableBody.displayName = "TableBody";

const TableFooter = forwardRef<
	HTMLTableSectionElement,
	HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tfoot
		className={cn("bg-primary font-medium text-primary-foreground", className)}
		ref={ref}
		{...props}
	/>
));
TableFooter.displayName = "TableFooter";

const TableRow = forwardRef<
	HTMLTableRowElement,
	HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
	<tr className={cn("border-b", className)} ref={ref} {...props} />
));
TableRow.displayName = "TableRow";

const TableHead = forwardRef<
	HTMLTableCellElement,
	ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<th
		className={cn(
			"h-12 w-auto border-r px-4 text-left align-middle font-medium text-[#666666] last:border-r-0 [&:has([role=checkbox])]:pr-0 [&:nth-last-child(2)]:border-r-0",
			className
		)}
		ref={ref}
		{...props}
	/>
));
TableHead.displayName = "TableHead";

const TableCell = forwardRef<
	HTMLTableCellElement,
	TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<td
		className={cn(
			"overflow-hidden border-r px-4 py-2 align-middle last:border-r-0 [&:has([role=checkbox])]:pr-0 [&:nth-last-child(2)]:border-r-0",
			className
		)}
		ref={ref}
		{...props}
	/>
));
TableCell.displayName = "TableCell";

const TableCaption = forwardRef<
	HTMLTableCaptionElement,
	HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption
		className={cn("mt-4 text-muted-foreground text-sm", className)}
		ref={ref}
		{...props}
	/>
));
TableCaption.displayName = "TableCaption";

export {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
};
