import { Skeleton } from "@faworra-new/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@faworra-new/ui/components/table";
import { Header } from "./header";

export function CategoriesSkeleton() {
	return (
		<div className="w-full">
			<Header />

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Tax Type</TableHead>
						<TableHead>Tax Rate</TableHead>
						<TableHead>Report Code</TableHead>
						<TableHead className="w-[50px]" />
					</TableRow>
				</TableHeader>

				<TableBody>
					{[...Array(15)].map((_, index) => (
						<TableRow
							className="h-[49px] hover:bg-transparent"
							key={index.toString()}
						>
							<TableCell className="w-[50px]">
								<Skeleton className="size-4 rounded-md" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-2 w-[20%]" />
							</TableCell>
							<TableCell className="w-[65px]">
								<Skeleton className="h-1 w-5" />
							</TableCell>
							<TableCell className="w-[65px]">
								<Skeleton className="h-1 w-5" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-1 w-5" />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
