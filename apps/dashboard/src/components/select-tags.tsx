"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@faworra-new/ui/components/dialog";
import { Input } from "@faworra-new/ui/components/input";
import { Label } from "@faworra-new/ui/components/label";
import MultipleSelector from "@faworra-new/ui/components/multiple-selector";
import { SubmitButton } from "@faworra-new/ui/components/submit-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";

type Option = {
	id?: string;
	value: string;
	label: string;
};

type Props = {
	tags?: Option[];
	onSelect?: (tag: Option) => void;
	onRemove?: (tag: Option) => void;
	onChange?: (tags: Option[]) => void;
};

export function SelectTags({ tags, onSelect, onRemove, onChange }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [selected, setSelected] = useState<Option[]>(tags ?? []);
	const [editingTag, setEditingTag] = useState<Option | null>(null);

	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data } = useQuery(trpc.tags.get.queryOptions());

	const updateTagMutation = useMutation(
		trpc.tags.update.mutationOptions({
			onSuccess: () => {
				setIsOpen(false);
				queryClient.invalidateQueries({
					queryKey: trpc.tags.get.queryKey(),
				});
			},
		})
	);

	const deleteTagMutation = useMutation(
		trpc.tags.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.tags.get.queryKey(),
				});
			},
		})
	);

	const createTagMutation = useMutation(
		trpc.tags.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.tags.get.queryKey() });
			},
		})
	);

	const transformedTags = data
		?.map((tag) => ({
			value: tag.name ?? "",
			label: tag.name ?? "",
			id: tag.id,
		}))
		.filter((tag) => !selected.some((s) => s.id === tag.id));

	const handleDelete = () => {
		if (editingTag?.id) {
			deleteTagMutation.mutate({ id: editingTag.id });

			setSelected(selected.filter((tag) => tag.id !== editingTag.id));
			setIsOpen(false);
		}
	};

	const handleUpdate = () => {
		if (editingTag?.id) {
			updateTagMutation.mutate({
				id: editingTag.id,
				name: editingTag.label,
			});
		}
	};

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<div className="w-full">
				<MultipleSelector
					creatable
					emptyIndicator={<p className="text-sm">No results found.</p>}
					onChange={(options) => {
						setSelected(options);
						onChange?.(options);

						const newTag = options.find(
							(tag) => !selected.find((opt) => opt.value === tag.value)
						);

						if (newTag) {
							onSelect?.(newTag);
							return;
						}

						if (options.length < selected.length) {
							const removedTag = selected.find(
								(tag) => !options.find((opt) => opt.value === tag.value)
							) as Option & { id: string };

							if (removedTag) {
								onRemove?.(removedTag);
								setSelected(options);
							}
						}
					}}
					onCreate={(option) => {
						createTagMutation.mutate(
							{ name: option.value },
							{
								onSuccess: (newTag) => {
									if (newTag) {
										const newTagOption = {
											id: newTag.id,
											label: newTag.name ?? "",
											value: newTag.name ?? "",
										};

										setSelected([...selected, newTagOption]);
										onSelect?.(newTagOption);
									}
								},
							}
						);
					}}
					options={transformedTags ?? []}
					placeholder="Select tags"
					renderOption={(option) => (
						<div className="group flex w-full items-center justify-between">
							<span>{option.label}</span>

							<button
								className="text-xs opacity-0 group-hover:opacity-50"
								onClick={(event) => {
									event.stopPropagation();
									setEditingTag(option);
									setIsOpen(true);
								}}
								type="button"
							>
								Edit
							</button>
						</div>
					)}
					value={selected}
				/>
			</div>

			<DialogContent className="max-w-[455px]">
				<div className="p-4">
					<DialogHeader>
						<DialogTitle>Edit Tag</DialogTitle>
						<DialogDescription>
							Make changes to the tag here. Click save when you&apos;re done.
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 flex w-full flex-col space-y-2">
						<Label>Name</Label>
						<Input
							onChange={(event) => {
								if (editingTag) {
									setEditingTag({
										id: editingTag.id,
										label: event.target.value,
										value: editingTag.value,
									});
								}
							}}
							value={editingTag?.label}
						/>
					</div>

					<DialogFooter className="mt-8 w-full">
						<div className="flex w-full flex-col space-y-2">
							<SubmitButton
								isSubmitting={updateTagMutation.isPending}
								onClick={handleUpdate}
							>
								Save
							</SubmitButton>

							<SubmitButton
								isSubmitting={deleteTagMutation.isPending}
								onClick={handleDelete}
								variant="outline"
							>
								Delete
							</SubmitButton>
						</div>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
