import { cn } from "@faworra-new/ui/lib/utils";
import { BankLogo } from "@/components/bank-logo";

type Props = {
	logoUrl?: string;
	name?: string;
	size?: number;
	className?: string;
};

export function TransactionBankAccount({
	logoUrl,
	name,
	size = 20,
	className,
}: Props) {
	return (
		<div className="mt-1 flex items-center space-x-2">
			{logoUrl && (
				<div
					className="flex-shrink-0 overflow-hidden rounded-full"
					style={{ width: size, height: size }}
				>
					<BankLogo alt={name ?? ""} size={size} src={logoUrl} />
				</div>
			)}
			<span className={cn("line-clamp-1 text-sm", className)}>
				{name ?? <span className="text-muted-foreground">-</span>}
			</span>
		</div>
	);
}
