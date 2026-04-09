"use client";

import { TableCell, TableRow } from "@faworra-new/ui/components/table";
import { cn } from "@faworra-new/ui/lib/utils";
import type {
	Cell,
	ColumnOrderState,
	ColumnSizingState,
	Row,
	VisibilityState,
} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import type React from "react";
import type { CSSProperties } from "react";
import { memo } from "react";
import type { TableColumnMeta } from "./types";

interface VirtualRowProps<TData> {
	columnOrder?: ColumnOrderState;
	columnSizing?: ColumnSizingState;
	columnVisibility?: VisibilityState;
	getStickyClassName: (columnId: string, baseClassName?: string) => string;
	getStickyStyle: (columnId: string) => CSSProperties;
	isExporting?: boolean;
	isSelected?: boolean;
	nonClickableColumns?: Set<string>;
	onCellClick?: (rowId: string, columnId: string) => void;
	row: Row<TData>;
	rowHeight: number;
	virtualStart: number;
}

function VirtualRowInner<TData>({
	row,
	virtualStart,
	rowHeight,
	onCellClick,
	getStickyStyle,
	getStickyClassName,
	nonClickableColumns = new Set(["select", "actions"]),
}: VirtualRowProps<TData>) {
	const cells = row.getVisibleCells();
	const lastCellId = cells[cells.length - 1]?.column.id ?? "";

	// Check if there are any non-sticky columns visible before actions
	const hasNonStickyBeforeActions = cells.some((cell) => {
		if (cell.column.id === "actions") {
			return false;
		}
		const meta = cell.column.columnDef.meta as TableColumnMeta | undefined;
		return !(meta?.sticky ?? false);
	});

	return (
		<TableRow
			className={cn(
				"group cursor-pointer select-text",
				"hover:bg-[#F2F1EF] hover:dark:bg-[#0f0f0f]",
				"flex items-center border-0",
				"absolute top-0 left-0 w-full min-w-full"
			)}
			data-index={row.index}
			style={{
				height: rowHeight,
				transform: `translateY(${virtualStart}px)`,
				contain: "layout style paint",
			}}
		>
			{cells.map((cell: Cell<TData, unknown>, cellIndex: number) => {
				const columnId = cell.column.id;
				const meta = cell.column.columnDef.meta as TableColumnMeta | undefined;
				const isSticky = meta?.sticky ?? false;
				const isActions = columnId === "actions";
				const isLastBeforeActions =
					cellIndex === cells.length - 2 && lastCellId === "actions";
				const actionsFullWidth = isActions && !hasNonStickyBeforeActions;
				const shouldFlex =
					(isLastBeforeActions && !isSticky) || actionsFullWidth;

				const cellStyle: CSSProperties = {
					width: actionsFullWidth ? undefined : cell.column.getSize(),
					...(!actionsFullWidth && getStickyStyle(columnId)),
					...(shouldFlex && { flex: 1 }),
				};

				const cellClassName = actionsFullWidth
					? "bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f]"
					: getStickyClassName(columnId, meta?.className);

				return (
					<TableCell
						className={cn(
							"flex h-full items-center border-border border-b",
							cellClassName,
							isActions && "justify-center"
						)}
						key={cell.id}
						onClick={() => {
							if (!nonClickableColumns.has(columnId)) {
								onCellClick?.(row.id, columnId);
							}
						}}
						style={cellStyle}
					>
						<div className="w-full overflow-hidden truncate">
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</div>
					</TableCell>
				);
			})}
		</TableRow>
	);
}

// Custom comparison for memo - re-render when row data, position, or column state changes
function arePropsEqual<TData>(
	prevProps: VirtualRowProps<TData>,
	nextProps: VirtualRowProps<TData>
): boolean {
	return (
		prevProps.row.id === nextProps.row.id &&
		prevProps.virtualStart === nextProps.virtualStart &&
		prevProps.rowHeight === nextProps.rowHeight &&
		// Check if row selection state changed (use prop for reliable comparison)
		prevProps.isSelected === nextProps.isSelected &&
		// Check if exporting state changed (for showing loading spinners)
		prevProps.isExporting === nextProps.isExporting &&
		// Re-render when column sizing, order, or visibility changes (reference equality)
		prevProps.columnSizing === nextProps.columnSizing &&
		prevProps.columnOrder === nextProps.columnOrder &&
		prevProps.columnVisibility === nextProps.columnVisibility &&
		// Re-render when row data changes (e.g., category, assigned, status)
		prevProps.row.original === nextProps.row.original
	);
}

// Export memoized component with generics
export const VirtualRow = memo(VirtualRowInner, arePropsEqual) as <TData>(
	props: VirtualRowProps<TData>
) => React.ReactNode;
