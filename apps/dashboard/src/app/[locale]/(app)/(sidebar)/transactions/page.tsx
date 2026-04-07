import { Badge } from "@faworra-new/ui/components/badge";

import { getServerViewer } from "@/lib/server-viewer";

import TransactionsTable from "./transactions-table";

export default async function TransactionsPage() {
	const viewer = await getServerViewer();
	const defaultCurrency = viewer.activeTeam?.settings?.baseCurrency ?? "GHS";

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<Badge variant="outline">Financial spine</Badge>
				<div>
					<h1 className="font-semibold text-3xl tracking-tight">
						Transactions
					</h1>
					<p className="mt-2 text-muted-foreground text-sm">
						Review and manage the first team-scoped financial records.
					</p>
				</div>
			</div>

			<TransactionsTable defaultCurrency={defaultCurrency} />
		</div>
	);
}
