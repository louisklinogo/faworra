"use client";

import { ComboboxDropdown } from "@faworra-new/ui/components/combobox-dropdown";
import { Spinner } from "@faworra-new/ui/components/spinner";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { getColorFromName } from "@/utils/categories";
import { CategoryColor } from "./category";

type Selected = {
	color: string;
	id: string;
	name: string;
	slug: string;
};

type Props = {
	excludeIds?: string[];
	hideLoading?: boolean;
	onChange: (selected: Selected | null) => void;
	parentId?: string | null;
};

function transformCategory(category: {
	children?: unknown[];
	color: string | null;
	description: string | null;
	id: string;
	name: string;
	parentId: string | null;
	slug: string | null;
	system: boolean | null;
	taxRate: number | null;
	taxType: string | null;
}): {
	color: string;
	id: string;
	label: string;
	slug: string;
} {
	return {
		id: category.id,
		label: category.name,
		color: category.color || getColorFromName(category.name) || "#6B7280",
		slug: category.slug!,
	};
}

export function SelectParentCategory({
	parentId,
	onChange,
	excludeIds = [],
	hideLoading,
}: Props) {
	const trpc = useTRPC();
	const { data, isLoading } = useQuery(
		trpc.transactions.categories.queryOptions()
	);

	// Filter to only parent categories (no parentId) and exclude specified IDs
	const parentCategories =
		data
			?.filter(
				(category) => !(category.parentId || excludeIds.includes(category.id))
			)
			.map(transformCategory) ?? [];

	// Find the selected parent category based on parentId
	const selectedParent = parentId
		? data?.find((category) => category.id === parentId)
		: null;
	const selectedValue = selectedParent
		? transformCategory(selectedParent)
		: undefined;

	if (!selectedParent && isLoading && !hideLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<ComboboxDropdown
			items={parentCategories}
			onSelect={(item) => {
				if (item.id === "none") {
					onChange(null);
				} else {
					onChange({
						id: item.id,
						name: item.label,
						color: item.color,
						slug: item.slug,
					});
				}
			}}
			placeholder="Select parent category"
			renderListItem={({ item }) => {
				return (
					<div className="flex items-center space-x-2">
						<CategoryColor color={item.color} />
						<span className="line-clamp-1">{item.label}</span>
					</div>
				);
			}}
			renderSelectedItem={(selectedItem) => (
				<div className="flex items-center space-x-2">
					<CategoryColor color={selectedItem.color} />
					<span className="max-w-[90%] truncate text-left font-normal">
						{selectedItem.label}
					</span>
				</div>
			)}
			searchPlaceholder="Search parent category"
			selectedItem={selectedValue}
		/>
	);
}
