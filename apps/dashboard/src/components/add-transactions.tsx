"use client";

import { Button } from "@faworra-new/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@faworra-new/ui/components/dropdown-menu";
import { Icons } from "@faworra-new/ui/components/icons";
import { toast } from "sonner";
import { useTransactionParams } from "@/hooks/use-transaction-params";

export function AddTransactions() {
	const { setParams: setTransactionParams } = useTransactionParams();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="icon" variant="outline">
					<Icons.Add size={17} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={10}>
				<DropdownMenuItem
					className="space-x-2"
					onClick={() =>
						toast.info("Bank connection flow is not wired yet in this surface.")
					}
				>
					<Icons.Accounts size={18} />
					<span>Connect account</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="space-x-2"
					onClick={() =>
						toast.info("Import/backfill flow is not wired yet in this surface.")
					}
				>
					<Icons.Import size={18} />
					<span>Import/backfill</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="space-x-2"
					onClick={() => setTransactionParams({ createTransaction: true })}
				>
					<Icons.CreateTransaction size={18} />
					<span>Create transaction</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="space-x-2"
					onClick={() =>
						document.getElementById("upload-transaction-files")?.click()
					}
				>
					<Icons.ReceiptLong size={18} />
					<span>Upload receipts</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
