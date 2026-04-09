"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Icons } from "@faworra-new/ui/components/icons";
import {
	Sheet,
	SheetContent,
	SheetHeader,
} from "@faworra-new/ui/components/sheet";
import { useCategoryParams } from "@/hooks/use-category-params";
import { CategoryForm } from "../forms/category-form";

export function CategoryCreateSheet() {
	const { setParams, createCategory } = useCategoryParams();

	const isOpen = Boolean(createCategory);

	return (
		<Sheet onOpenChange={() => setParams(null)} open={isOpen}>
			<SheetContent>
				<SheetHeader className="mb-6 flex flex-row items-center justify-between">
					<h2 className="text-xl">Create Category</h2>
					<Button
						className="m-0 size-auto p-0 hover:bg-transparent"
						onClick={() => setParams(null)}
						size="icon"
						variant="ghost"
					>
						<Icons.Close className="size-5" />
					</Button>
				</SheetHeader>

				<CategoryForm />
			</SheetContent>
		</Sheet>
	);
}
