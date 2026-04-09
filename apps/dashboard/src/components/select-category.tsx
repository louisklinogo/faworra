"use client";

import { ComboboxDropdown } from "@faworra-new/ui/components/combobox-dropdown";
import { Spinner } from "@faworra-new/ui/components/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { getColorFromName } from "@/utils/categories";
import { CategoryColor } from "./category";

type Selected = {
	id: string;
	name: string;
	color?: string | null;
	slug: string | null;
	children?: Selected[];
};

type Props = {
	selected?: Selected;
	onChange: (selected: Selected) => void;
	headless?: boolean;
	hideLoading?: boolean;
};

interface CategoryItem {
	children: CategoryItem[];
	color: string;
	id: string;
	label: string;
	slug: string;
}

function transformCategory(category: {
	id: string;
	name: string;
	color: string | null;
	slug: string | null;
}): CategoryItem {
	return {
		id: category.id,
		label: category.name,
		color: category.color ?? getColorFromName(category.name) ?? "#606060",
		slug: category.slug ?? "",
		children: [],
	};
}

// Flatten categories to include both parents and children
function flattenCategories(categories: CategoryItem[]): CategoryItem[] {
	const flattened: CategoryItem[] = [];

	for (const category of categories) {
		// Add parent category
		flattened.push({
			...category,
		});

		// Add children if they exist
		if (category.children && category.children.length > 0) {
			for (const child of category.children) {
				flattened.push({
					...child,
					label: `  ${child.label}`, // Add indentation for visual hierarchy
				});
			}
		}
	}

	return flattened;
}

export function SelectCategory({
	selected,
	onChange,
	headless,
	hideLoading,
}: Props) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery(
		trpc.transactions.categories.queryOptions()
	);

	// Transform and flatten categories
	const transformedCategories = data?.map(transformCategory) ?? [];
	const categories = flattenCategories(transformedCategories);

	const createCategoryMutation = useMutation(
		trpc.transactions.createCategory.mutationOptions({
			onSuccess: (newCategory) => {
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.categories.queryKey(),
				});

				if (newCategory) {
					onChange({
						id: newCategory.id,
						name: newCategory.name,
						color: newCategory.color,
						slug: newCategory.slug,
					});
				}
			},
		})
	);

	const selectedValue = selected
		? transformCategory({
				id: selected.id,
				name: selected.name,
				color: selected.color ?? null,
				slug: selected.slug,
			})
		: undefined;

	if (!selected && isLoading && !hideLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<ComboboxDropdown
			disabled={createCategoryMutation.isPending}
			headless={headless}
			items={categories}
			onSelect={(item) => {
				onChange({
					id: item.id,
					name: item.label.trim(),
					color: item.color,
					slug: item.slug,
				});
			}}
			placeholder="Select category"
			searchPlaceholder="Search category"
			selectedItem={selectedValue}
			{...(!headless && {
				onCreate: (value) => {
					const slug = value
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-")
						.replace(/^-|-$/g, "");
					createCategoryMutation.mutate({
						name: value,
						color: getColorFromName(value),
						// Note: 'kind' removed - categories no longer have kind field
						slug,
					});
				},
			})}
			renderListItem={({ item }) => {
				return (
					<div className="flex items-center space-x-2">
						<CategoryColor color={item.color} />
						<span className="line-clamp-1">{item.label}</span>
					</div>
				);
			}}
			renderOnCreate={(value) => {
				if (!headless) {
					return (
						<div className="flex items-center space-x-2">
							<CategoryColor color={getColorFromName(value)} />
							<span>{`Create "${value}"`}</span>
						</div>
					);
				}
			}}
			renderSelectedItem={(selectedItem) => (
				<div className="flex items-center space-x-2">
					<CategoryColor color={selectedItem.color} />
					<span className="max-w-[90%] truncate text-left">
						{selectedItem.label}
					</span>
				</div>
			)}
		/>
	);
}
