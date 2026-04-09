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
				<Button size="icon" variant="outline">
					<Icons.Tune size={18} />
				</Button>
			</PopoverTrigger>

			<PopoverContent align="end" className="w-[200px] p-0" sideOffset={8}>
				<div className="flex max-h-[352px] flex-col space-y-2 overflow-auto p-4">
					{columns
						.filter((column) => column.columnDef.enableHiding !== false)
						.map((column) => {
							return (
								<div className="flex items-center space-x-2" key={column.id}>
									<Checkbox
										checked={column.getIsVisible()}
										id={column.id}
										onCheckedChange={(checked) =>
											column.toggleVisibility(checked === true)
										}
									/>
									<label
										className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										htmlFor={column.id}
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
