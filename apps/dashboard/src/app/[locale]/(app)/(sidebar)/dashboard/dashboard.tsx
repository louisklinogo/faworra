"use client";

import { Badge } from "@faworra-new/ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@faworra-new/ui/components/table";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

export default function Dashboard({
	activeTeamName,
}: {
	activeTeamName: string;
}) {
	const overview = useQuery(trpc.overview.summary.queryOptions());

	const rows = [
		{
			label: "Workspace",
			value: activeTeamName,
		},
		{
			label: "Transactions",
			value: overview.data?.transactionCount ?? 0,
		},
		{
			label: "Income total",
			value: overview.data?.incomeTotal ?? 0,
		},
		{
			label: "Expense total",
			value: overview.data?.expenseTotal ?? 0,
		},
		{
			label: "Net total",
			value: overview.data?.netTotal ?? "Loading…",
		},
	];

	return (
		<div className="rounded-none border border-border bg-background">
			<div className="flex items-center justify-between border-border border-b px-4 py-3">
				<h2 className="font-medium text-sm">Overview</h2>
				<Badge variant="tag">Foundation shell</Badge>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Metric</TableHead>
						<TableHead>Value</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={row.label}>
							<TableCell className="font-medium">{row.label}</TableCell>
							<TableCell>{row.value}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
