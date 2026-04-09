"use client";

import { Badge } from "@faworra-new/ui/components/badge";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@faworra-new/ui/components/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@faworra-new/ui/components/popover";
import { cn } from "@faworra-new/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";

type Tag = {
	id: string;
	name: string | null;
};

type Props = {
	transactionId: string;
	tags?: Tag[];
};

export function InlineSelectTags({ transactionId, tags = [] }: Props) {
	const [open, setOpen] = useState(false);
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: allTags } = useQuery(trpc.tags.get.queryOptions());

	const createTransactionTagMutation = useMutation(
		trpc.transactionTags.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.list.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.getById.queryKey(),
				});
			},
		})
	);

	const deleteTransactionTagMutation = useMutation(
		trpc.transactionTags.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.list.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.getById.queryKey(),
				});
			},
		})
	);

	const createTagMutation = useMutation(
		trpc.tags.create.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({ queryKey: trpc.tags.get.queryKey() });
				if (data) {
					createTransactionTagMutation.mutate({
						transactionId,
						tagId: data.id,
					});
				}
			},
		})
	);

	const [inputValue, setInputValue] = useState("");

	const selectedTagIds = new Set(tags.map((tag) => tag.id));

	const allTagsList =
		allTags
			?.filter((tag) => tag.name != null)
			.map((tag) => ({
				id: tag.id,
				name: tag.name!,
			})) ?? [];

	const filteredTags = allTagsList.filter((tag) =>
		tag.name.toLowerCase().includes(inputValue.toLowerCase())
	);

	const showCreate =
		Boolean(inputValue) &&
		!filteredTags.some(
			(tag) => tag.name.toLowerCase() === inputValue.toLowerCase()
		);

	const handleTagToggle = (tagId: string) => {
		if (selectedTagIds.has(tagId)) {
			deleteTransactionTagMutation.mutate({
				transactionId,
				tagId,
			});
		} else {
			createTransactionTagMutation.mutate({
				transactionId,
				tagId,
			});
		}
	};

	const handleCreateTag = () => {
		if (inputValue.trim()) {
			createTagMutation.mutate({ name: inputValue.trim() });
			setInputValue("");
		}
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
					{tags.length > 0 ? (
						<div className="scrollbar-hide flex items-center space-x-2 overflow-x-auto">
							{tags
								.filter((tag) => tag.name != null)
								.map((tag) => (
									<Badge
										className="flex-shrink-0 whitespace-nowrap"
										key={tag.id}
										variant="secondary"
									>
										{tag.name}
									</Badge>
								))}
						</div>
					) : (
						<span className="text-muted-foreground">-</span>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="p-0"
				onClick={(e) => {
					e.stopPropagation();
				}}
				side="bottom"
			>
				<div className="h-[270px] w-[286px]">
					<Command loop shouldFilter={false}>
						<CommandInput
							className="px-3"
							onValueChange={setInputValue}
							placeholder="Search tags..."
							value={inputValue}
						/>
						<CommandGroup>
							<CommandList className="max-h-[225px] overflow-auto">
								{filteredTags.map((tag) => {
									const isSelected = selectedTagIds.has(tag.id);
									return (
										<CommandItem
											className="cursor-pointer"
											key={tag.id}
											onSelect={(value) => {
												if (typeof value === "string") {
													handleTagToggle(value);
												}
											}}
											value={tag.id}
										>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													isSelected ? "opacity-100" : "opacity-0"
												)}
											/>
											{tag.name}
										</CommandItem>
									);
								})}
								<CommandEmpty>No tags found.</CommandEmpty>
								{showCreate && (
									<CommandItem
										className="cursor-pointer"
										key={inputValue}
										onMouseDown={(event) => {
											event.preventDefault();
											event.stopPropagation();
										}}
										onSelect={handleCreateTag}
										value={inputValue}
									>
										<span>{`Create "${inputValue}"`}</span>
									</CommandItem>
								)}
							</CommandList>
						</CommandGroup>
					</Command>
				</div>
			</PopoverContent>
		</Popover>
	);
}
