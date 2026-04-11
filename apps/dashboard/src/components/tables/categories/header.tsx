"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Input } from "@faworra-new/ui/components/input";
import type { Table } from "@tanstack/react-table";
import { useCategoryParams } from "@/hooks/use-category-params";
import type { Category } from "./columns";

type Props = {
	table?: Table<Category>;
};

export function Header({ table }: Props) {
	const { setParams } = useCategoryParams();

	const handleCreateCategory = () => {
		setParams({ createCategory: true });
	};

	const meta = table?.options.meta as
		| { searchValue?: string; setSearchValue?: (value: string) => void }
		| undefined;

	const searchValue = meta?.searchValue ?? "";
	const setSearchValue = meta?.setSearchValue;

	return (
		<div className="flex items-center justify-between py-4">
			<Input
				className="max-w-sm"
				onChange={(event) => setSearchValue?.(event.target.value)}
				placeholder="Search..."
				value={searchValue}
			/>

			<Button onClick={handleCreateCategory}>Create</Button>
		</div>
	);
}
