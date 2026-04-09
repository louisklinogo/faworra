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
				<Button variant="outline" size="icon">
					<Icons.Add size={17} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent sideOffset={10} align="end">
				<DropdownMenuItem
					onClick={() =>
						toast.info("Bank connection flow is not wired yet in this surface.")
					}
					className="space-x-2"
				>
					<Icons.Accounts size={18} />
					<span>Connect account</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() =>
						toast.info("Import/backfill flow is not wired yet in this surface.")
					}
					className="space-x-2"
				>
					<Icons.Import size={18} />
					<span>Import/backfill</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTransactionParams({ createTransaction: true })}
					className="space-x-2"
				>
					<Icons.CreateTransaction size={18} />
					<span>Create transaction</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() =>
						document.getElementById("upload-transaction-files")?.click()
					}
					className="space-x-2"
				>
					<Icons.ReceiptLong size={18} />
					<span>Upload receipts</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
