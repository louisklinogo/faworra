import { Avatar } from "@faworra-new/ui/components/avatar";
import Image from "next/image";

type Props = {
	avatarUrl?: string | null;
	fullName?: string | null;
};

export function AssignedUser({ avatarUrl, fullName }: Props) {
	return (
		<div className="flex items-center space-x-2">
			{avatarUrl && (
				<Avatar className="h-5 w-5">
					<Image alt={fullName ?? ""} height={20} src={avatarUrl} width={20} />
				</Avatar>
			)}
			<span className="truncate">{fullName?.split(" ").at(0)}</span>
		</div>
	);
}
