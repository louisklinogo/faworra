"use client";

import {
	horizontalListSortingStrategy,
	SortableContext,
} from "@dnd-kit/sortable";
import { Button } from "@faworra-new/ui/components/button";
import { Checkbox } from "@faworra-new/ui/components/checkbox";
import {
	TableHead,
	TableHeader,
	TableRow,
} from "@faworra-new/ui/components/table";
import type { Header, Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo } from "react";
import {
	ACTIONS_FULL_WIDTH_HEADER_CLASS,
	ACTIONS_STICKY_HEADER_CLASS,
	type TableColumnMeta,
	type TableScrollState,
} from "@/components/tables/core/types";
import { DraggableHeader } from "@/components/tables/draggable-header";
import { ResizeHandle } from "@/components/tables/resize-handle";
import { useSortQuery } from "@/hooks/use-sort-query";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import {
	NON_REORDERABLE_COLUMNS,
	SORT_FIELD_MAPS,
	STICKY_COLUMNS,
} from "@/utils/table-configs";

interface Props<TData> {
	loading?: boolean;
	table?: Table<TData>;
	tableScroll?: TableScrollState;
}

export function DataTableHeader<TData>({
	table,
	loading,
	tableScroll,
}: Props<TData>) {
	const { sortColumn, sortValue, createSortQuery } = useSortQuery();

	// Use the reusable sticky columns hook
	const { getStickyStyle, getStickyClassName, isVisible } = useStickyColumns({
		table,
		loading,
		stickyColumns: STICKY_COLUMNS.transactions,
	});

	// Get sortable column IDs (excluding sticky columns)
	const sortableColumnIds = useMemo(() => {
		if (!table) {
			return [];
		}
		return table
			.getAllLeafColumns()
			.filter((col) => !NON_REORDERABLE_COLUMNS.transactions.has(col.id))
			.map((col) => col.id);
	}, [table]);

	if (!table) {
		return null;
	}

	const headerGroups = table.getHeaderGroups();

	return (
		<TableHeader className="sticky top-0 z-20 block w-full border-0 bg-background">
			{headerGroups.map((headerGroup) => (
				<TableRow
					className="!border-b-0 flex h-[45px] min-w-full items-center hover:bg-transparent"
					key={headerGroup.id}
				>
					<SortableContext
						items={sortableColumnIds}
						strategy={horizontalListSortingStrategy}
					>
						{headerGroup.headers.map((header, headerIndex, headers) => {
							const columnId = header.column.id;
							const meta = header.column.columnDef.meta as
								| TableColumnMeta
								| undefined;
							const isSticky = meta?.sticky;
							const canReorder =
								!NON_REORDERABLE_COLUMNS.transactions.has(columnId);
							const isActions = columnId === "actions";

							if (!isVisible(columnId)) {
								return null;
							}

							// Check if actions should be full width (no non-sticky visible columns)
							const hasNonStickyVisible = headers.some((h) => {
								if (h.column.id === "actions") {
									return false;
								}
								if (!isVisible(h.column.id)) {
									return false;
								}
								const hMeta = h.column.columnDef.meta as
									| TableColumnMeta
									| undefined;
								return !hMeta?.sticky;
							});
							const actionsFullWidth = isActions && !hasNonStickyVisible;

							// Check if this column should flex (last before actions, or full-width actions)
							const isLastBeforeActions =
								headerIndex === headers.length - 2 &&
								headers[headers.length - 1]?.column.id === "actions";
							const shouldFlex =
								(isLastBeforeActions && !isSticky) || actionsFullWidth;

							const headerStyle = {
								width: actionsFullWidth ? undefined : header.getSize(),
								minWidth: actionsFullWidth
									? undefined
									: isSticky
										? header.getSize()
										: header.column.columnDef.minSize,
								maxWidth: actionsFullWidth
									? undefined
									: isSticky
										? header.getSize()
										: undefined,
								...(!actionsFullWidth && getStickyStyle(columnId)),
								...(shouldFlex && { flex: 1 }),
							};

							// Non-reorderable columns (sticky + actions)
							if (!canReorder) {
								const stickyClass = getStickyClassName(
									columnId,
									"group/header relative h-full px-4 border-t border-border flex items-center"
								);
								const finalClassName = isActions
									? actionsFullWidth
										? ACTIONS_FULL_WIDTH_HEADER_CLASS
										: ACTIONS_STICKY_HEADER_CLASS
									: `${stickyClass} bg-background z-10`;

								return (
									<TableHead
										className={finalClassName}
										key={header.id}
										style={headerStyle}
									>
										{renderHeaderContent(
											header,
											columnId,
											sortColumn,
											sortValue,
											createSortQuery,
											table,
											tableScroll
										)}
										<ResizeHandle header={header} />
									</TableHead>
								);
							}

							// Draggable columns
							return (
								<DraggableHeader
									className={getStickyClassName(
										columnId,
										"group/header relative flex h-full items-center border-border border-t px-4"
									)}
									id={columnId}
									key={header.id}
									style={headerStyle}
								>
									{renderHeaderContent(
										header,
										columnId,
										sortColumn,
										sortValue,
										createSortQuery,
										table,
										tableScroll
									)}
									{header.column.getCanResize() && (
										<ResizeHandle header={header} />
									)}
								</DraggableHeader>
							);
						})}
					</SortableContext>
				</TableRow>
			))}
		</TableHeader>
	);
}

/**
 * Renders the content inside a header cell
 */
function renderHeaderContent<TData>(
	header: Header<TData, unknown>,
	columnId: string,
	sortColumn: string | undefined,
	sortValue: string | undefined,
	createSortQuery: (name: string) => void,
	table: Table<TData>,
	tableScroll?: TableScrollState
) {
	const sortField = SORT_FIELD_MAPS.transactions[columnId];

	// Select column - checkbox
	if (columnId === "select") {
		return (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
			/>
		);
	}

	// Actions column - static text
	if (columnId === "actions") {
		return (
			<span className="w-full text-center text-muted-foreground">Actions</span>
		);
	}

	// Default sortable header
	if (sortField) {
		const headerLabel = getHeaderLabel(columnId);
		return (
			<div className="w-full overflow-hidden">
				<SortButton
					currentSortColumn={sortColumn}
					currentSortValue={sortValue}
					label={headerLabel}
					onSort={createSortQuery}
					sortField={sortField}
				/>
			</div>
		);
	}

	// Fallback - just render the header text
	return (
		<span className="truncate">{header.column.columnDef.header as string}</span>
	);
}

function SortButton({
	label,
	sortField,
	currentSortColumn,
	currentSortValue,
	onSort,
}: {
	label: string;
	sortField: string;
	currentSortColumn?: string;
	currentSortValue?: string;
	onSort: (field: string) => void;
}) {
	return (
		<Button
			className="min-w-0 max-w-full space-x-2 p-0 hover:bg-transparent"
			onClick={(e) => {
				e.stopPropagation(); // Prevent drag when clicking sort
				onSort(sortField);
			}}
			variant="ghost"
		>
			<span className="truncate">{label}</span>
			{sortField === currentSortColumn && currentSortValue === "asc" && (
				<ArrowDown size={16} />
			)}
			{sortField === currentSortColumn && currentSortValue === "desc" && (
				<ArrowUp size={16} />
			)}
		</Button>
	);
}

function getHeaderLabel(columnId: string): string {
	const labels: Record<string, string> = {
		transactionDate: "Date",
		description: "Description",
		amount: "Amount",
		category: "Category",
		status: "Status",
		actions: "Actions",
	};
	return labels[columnId] || columnId;
}
