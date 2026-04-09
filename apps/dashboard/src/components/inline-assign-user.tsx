"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@faworra-new/ui/components/popover";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AssignedUser } from "@/components/assigned-user";
import { useTRPC } from "@/trpc/client";

type User = {
	id: string;
	avatarUrl?: string | null;
	fullName: string | null;
};

type Props = {
	selectedId?: string;
	onSelect: (user: User) => void;
};

export function InlineAssignUser({ selectedId, onSelect }: Props) {
	const [open, setOpen] = useState(false);
	const trpc = useTRPC();

	const { data: members } = useQuery(trpc.team.members.queryOptions());

	const users = members ?? [];
	const selectedUser = users.find((m) => m.user?.id === selectedId)?.user;

	const handleSelect = (user: User) => {
		onSelect(user);
		setOpen(false);
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<button
					className="w-full text-left transition-opacity hover:opacity-70"
					onClick={(e) => {
						e.stopPropagation();
					}}
					type="button"
				>
					{selectedUser ? (
						<AssignedUser
							avatarUrl={selectedUser.avatarUrl}
							fullName={selectedUser.fullName}
						/>
					) : (
						<span className="text-muted-foreground">-</span>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-[200px] p-2"
				onClick={(e) => {
					e.stopPropagation();
				}}
				side="bottom"
			>
				<div className="flex flex-col gap-1">
					{users.map((member) => {
						if (!member.user) {
							return null;
						}

						return (
							<button
								className="flex w-full items-center rounded-md p-2 text-left text-sm transition-colors hover:bg-accent"
								key={member.user.id}
								onClick={() => {
									handleSelect({
										id: member.user.id,
										avatarUrl: member.user.avatarUrl ?? null,
										fullName: member.user.fullName ?? null,
									});
								}}
								type="button"
							>
								<AssignedUser
									avatarUrl={member.user.avatarUrl}
									fullName={member.user.fullName}
								/>
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
