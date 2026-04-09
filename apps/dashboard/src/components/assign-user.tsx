"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@faworra-new/ui/components/select";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { AssignedUser } from "./assigned-user";

type User = {
	id: string;
	avatar_url?: string | null;
	full_name: string | null;
};

type Props = {
	selectedId?: string;
	onSelect: (user?: User) => void;
};

export function AssignUser({ selectedId, onSelect }: Props) {
	const [value, setValue] = useState<string>();
	const trpc = useTRPC();

	const { data: users } = useQuery(trpc.team.members.queryOptions());

	useEffect(() => {
		setValue(selectedId);
	}, [selectedId]);

	return (
		<Select
			onValueChange={(id) => {
				const found = users?.find(({ user }) => user?.id === id)?.user;

				if (found) {
					onSelect({
						id: found.id,
						full_name: found.fullName ?? null,
						avatar_url: found.avatarUrl ?? null,
					});
				} else {
					onSelect(undefined);
				}
			}}
			value={value}
		>
			<SelectTrigger
				className="line-clamp-1 truncate"
				id="assign"
				onKeyDown={(evt) => evt.preventDefault()}
			>
				<SelectValue placeholder="Select" />
			</SelectTrigger>

			<SelectContent className="max-h-[200px] overflow-y-auto">
				{users?.map(({ user }) => {
					return (
						<SelectItem key={user?.id} value={user?.id ?? ""}>
							<AssignedUser
								avatarUrl={user?.avatarUrl}
								fullName={user?.fullName}
							/>
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}
