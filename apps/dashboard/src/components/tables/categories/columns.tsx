"use client";

import { Button } from "@faworra-new/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@faworra-new/ui/components/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@faworra-new/ui/components/tooltip";
import { cn } from "@faworra-new/ui/lib/utils";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

export interface CategoriesTableMeta {
	deleteCategory: (id: string) => void;
	expandedCategories: Set<string>;
	onEdit: (id: string) => void;
	searchValue?: string;
	setExpandedCategories: Dispatch<SetStateAction<Set<string>>>;
	setSearchValue?: Dispatch<SetStateAction<string>>;
}

export type Category = {
	children?: Category[];
	color: string | null;
	description: string | null;
	excluded: boolean | null;
	hasChildren?: boolean;
	id: string;
	isChild?: boolean;
	name: string;
	parentId: string | null;
	slug: string | null;
	system: boolean | null;
	taxRate: number | null;
	taxReportingCode: string | null;
	taxType: string | null;
};

// Check if a category should show a tooltip
function shouldShowCategoryTooltip(category: Category): boolean {
	// Show tooltip if category has a user-defined description
	if (category.description) {
		return true;
	}
	// Show tooltip for system categories (they have localized descriptions)
	if (category.system) {
		return true;
	}
	// Don't show tooltip for user-created categories without descriptions
	return false;
}

// Get tax type display label
function getTaxTypeLabel(taxType: string | null): string {
	if (!taxType) {
		return "-";
	}

	const labels: Record<string, string> = {
		vat: "VAT",
		gst: "GST",
		hst: "HST",
		pst: "PST",
		qst: "QST",
		sales_tax: "Sales Tax",
		exempt: "Exempt",
	};

	return labels[taxType] ?? taxType;
}

// Flatten categories to include both parents and children with hierarchy info
export function flattenCategories(categories: Category[]): Category[] {
	const flattened: Category[] = [];

	for (const category of categories) {
		// Add parent category
		flattened.push({
			...category,
			isChild: false,
			hasChildren: category.children && category.children.length > 0,
		});

		// Add children if they exist
		if (category.children && category.children.length > 0) {
			for (const child of category.children) {
				flattened.push({
					...child,
					isChild: true,
					parentId: category.id,
					hasChildren: false,
				});
			}
		}
	}

	return flattened;
}

export const columns: ColumnDef<Category>[] = [
	{
		header: "Name",
		accessorKey: "name",
		cell: ({ row, table }) => {
			// Get expanded state from table meta
			const meta = table.options.meta as CategoriesTableMeta;
			const tableExpandedCategories = meta?.expandedCategories || new Set();
			const setTableExpandedCategories = meta?.setExpandedCategories;

			const isExpanded = tableExpandedCategories.has(row.original.id);
			const hasChildren = row.original.hasChildren;
			const isChild = row.original.isChild;

			const toggleExpanded = () => {
				if (!setTableExpandedCategories) {
					return;
				}

				const newExpanded = new Set(tableExpandedCategories);
				if (isExpanded) {
					newExpanded.delete(row.original.id);
				} else {
					newExpanded.add(row.original.id);
				}
				setTableExpandedCategories(newExpanded);
			};

			return (
				<div className={cn("flex items-center space-x-2", isChild && "ml-10")}>
					{hasChildren && !isChild && (
						<Button
							className="h-4 w-4 p-0 hover:bg-transparent"
							onClick={(e) => {
								e.stopPropagation();
								toggleExpanded();
							}}
							size="sm"
							variant="ghost"
						>
							{isExpanded ? (
								<ChevronDown className="h-3 w-3" />
							) : (
								<ChevronRight className="h-3 w-3" />
							)}
						</Button>
					)}
					{!(hasChildren || isChild) && <div className="w-4" />}
					<div
						className="size-3 rounded-full bg-muted"
						style={{
							backgroundColor: row.original.color ?? undefined,
						}}
					/>
					{shouldShowCategoryTooltip(row.original) ? (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										className={cn(
											hasChildren && !isChild
												? "cursor-pointer"
												: "cursor-default"
										)}
										onClick={
											hasChildren && !isChild
												? (e) => {
														e.stopPropagation();
														toggleExpanded();
													}
												: undefined
										}
									>
										{row.getValue("name")}
									</span>
								</TooltipTrigger>
								<TooltipContent
									className="px-3 py-1.5 text-xs"
									side="right"
									sideOffset={10}
								>
									{row.original.description}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					) : (
						<span
							className={cn(
								hasChildren && !isChild ? "cursor-pointer" : "cursor-default"
							)}
							onClick={
								hasChildren && !isChild
									? (e) => {
											e.stopPropagation();
											toggleExpanded();
										}
									: undefined
							}
						>
							{row.getValue("name")}
						</span>
					)}

					{row.original.system && (
						<div className="pl-2">
							<span className="rounded-full border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground">
								System
							</span>
						</div>
					)}
				</div>
			);
		},
	},
	{
		header: "Tax Type",
		accessorKey: "taxType",
		cell: ({ row }) =>
			row.getValue("taxType") ? getTaxTypeLabel(row.getValue("taxType")) : "-",
	},
	{
		header: "Tax Rate",
		accessorKey: "taxRate",
		cell: ({ row }) =>
			row.getValue("taxRate") ? `${row.getValue("taxRate")}%` : "-",
	},
	{
		header: () => <span className="whitespace-nowrap">Report Code</span>,
		accessorKey: "taxReportingCode",
		cell: ({ row }) => row.getValue("taxReportingCode") || "-",
	},
	{
		id: "actions",
		cell: ({ row, table }) => {
			const meta = table.options.meta as CategoriesTableMeta;

			return (
				<div className="text-right">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="h-8 w-8 p-0"
								onClick={(e) => e.stopPropagation()}
								variant="ghost"
							>
								<DotsHorizontalIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							onClick={(e) => e.stopPropagation()}
						>
							<DropdownMenuItem onClick={() => meta?.onEdit?.(row.original.id)}>
								Edit
							</DropdownMenuItem>

							{!row.original.system && (
								<DropdownMenuItem
									className="text-destructive"
									onClick={() => meta?.deleteCategory?.(row.original.id)}
								>
									Remove
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			);
		},
	},
];
