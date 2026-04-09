"use client";

import type { ColumnSizingState, VisibilityState } from "@tanstack/react-table";
import { TableSkeleton } from "@/components/tables/core";
import { columns } from "./columns";

interface LoadingProps {
	columnOrder?: string[];
	columnSizing?: ColumnSizingState;
	columnVisibility?: VisibilityState;
	isEmpty?: boolean;
}

export function Loading({
	isEmpty,
	columnVisibility = {},
	columnSizing = {},
	columnOrder = [],
}: LoadingProps) {
	return (
		<TableSkeleton
			actionsColumnId="actions"
			columnOrder={columnOrder}
			columnSizing={columnSizing}
			columns={columns}
			columnVisibility={columnVisibility}
			isEmpty={isEmpty}
			stickyColumnIds={["select", "date", "description"]}
		/>
	);
}
