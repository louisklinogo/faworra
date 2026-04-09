"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Checkbox } from "@faworra-new/ui/components/checkbox";
import { Icons } from "@faworra-new/ui/components/icons";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@faworra-new/ui/components/popover";
import { useTransactionsStore } from "@/store/transactions";

export function TransactionsColumnVisibility() {
	const { columns } = useTransactionsStore();

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="icon">
					<Icons.Tune size={18} />
				</Button>
			</PopoverTrigger>

			<PopoverContent className="w-[200px] p-0" align="end" sideOffset={8}>
				<div className="flex flex-col p-4 space-y-2 max-h-[352px] overflow-auto">
					{columns
						.filter((column) => column.columnDef.enableHiding !== false)
						.map((column) => {
							return (
								<div key={column.id} className="flex items-center space-x-2">
									<Checkbox
										id={column.id}
										checked={column.getIsVisible()}
										onCheckedChange={(checked) =>
											column.toggleVisibility(checked === true)
										}
									/>
									<label
										htmlFor={column.id}
										className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										{column.columnDef.header?.toString() ?? column.id}
									</label>
								</div>
							);
						})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
