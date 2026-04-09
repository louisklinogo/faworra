"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Input } from "@faworra-new/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@faworra-new/ui/components/table";
import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
	TransactionCategoryForm,
	type CategoryFormValues,
} from "./category-form";
import { useTRPC } from "@/trpc/client";

interface TransactionCategory {
	color: string | null;
	createdAt: string | null;
	excluded: boolean | null;
	id: string;
	// Note: 'kind' removed from categories - all categories are universal
	description: string | null;
	parentId: string | null;
	name: string;
	slug: string | null;
	system: boolean | null;
	taxRate: number | null;
	taxType: string | null;
	taxReportingCode: string | null;
	teamId: string;
}

function CategoryRow({
	category,
	onDelete,
	canWrite,
}: {
	canWrite: boolean;
	category: TransactionCategory;
	onDelete: (id: string) => void;
}) {
	return (
		<TableRow>
			<TableCell>
				<div className="flex items-center gap-2">
					<div
						className="h-3 w-3 rounded-full bg-muted"
						style={category.color ? { backgroundColor: category.color } : undefined}
					/>
					<span className="font-medium">{category.name}</span>
					{category.system && (
						<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
							System
						</span>
					)}
				</div>
			</TableCell>
			<TableCell className="font-mono text-xs text-muted-foreground">
				{category.slug ?? "—"}
			</TableCell>
			<TableCell>{category.taxRate ? `${category.taxRate}%` : "—"}</TableCell>
			<TableCell>{category.excluded ? "Excluded" : "Included"}</TableCell>
			<TableCell>
				{canWrite && !category.system ? (
					<Button
						onClick={() => onDelete(category.id)}
						size="sm"
						variant="ghost"
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				) : null}
			</TableCell>
		</TableRow>
	);
}

export default function CategoriesPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = useState(false);
	// Note: filter removed - categories no longer have 'kind' field
	// All categories are universal (Midday pattern)

	const { data: viewer } = useQuery(trpc.viewer.queryOptions());
	const membershipRole = viewer?.membership?.role;
	const canWrite =
		membershipRole === "owner" ||
		membershipRole === "admin" ||
		membershipRole === "accountant";

	const { data: categories = [] } = useSuspenseQuery(
		trpc.transactions.categories.queryOptions(),
	);

	const deleteMutation = useMutation(
		trpc.transactions.deleteCategory.mutationOptions({
			onError: (error) => {
				toast.error(error.message || "Failed to delete category");
			},
			onSuccess: async () => {
				toast.success("Category deleted");
				await queryClient.invalidateQueries({
					queryKey: trpc.transactions.categories.queryKey(),
				});
			},
		}),
	);

	// Note: No more filtering by kind - all categories shown
	const filteredCategories = categories;

	const handleDelete = (id: string) => {
		if (confirm("Are you sure you want to delete this category?")) {
			deleteMutation.mutate({ id });
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-lg tracking-tight">Categories</h1>
					<p className="mt-0.5 text-muted-foreground text-xs">
						Organize your transactions with custom categories.
					</p>
				</div>
				{canWrite && (
					<Button onClick={() => setCreateOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						New Category
					</Button>
				)}
			</div>

			<div className="flex items-center gap-4">
				<Input className="max-w-[300px]" placeholder="Search categories..." />
			</div>

			<div className="rounded-none border border-border bg-background">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Slug</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Reports</TableHead>
							<TableHead className="w-[50px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredCategories.length === 0 ? (
							<TableRow>
								<TableCell className="text-center py-12" colSpan={5}>
									<div className="flex flex-col items-center gap-2">
										<Tag className="h-8 w-8 text-muted-foreground" />
										<p className="text-muted-foreground">No categories found</p>
										{canWrite && (
											<Button
												onClick={() => setCreateOpen(true)}
												size="sm"
												variant="outline"
											>
												Create your first category
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						) : (
							filteredCategories.map((category) => (
								<CategoryRow
									key={category.id}
									canWrite={canWrite}
									category={category}
									onDelete={handleDelete}
								/>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div className="rounded-none border border-border bg-background p-4">
					<div className="text-muted-foreground text-xs">Total Categories</div>
					<div className="text-2xl font-semibold">{categories.length}</div>
				</div>
				<div className="rounded-none border border-border bg-background p-4">
					<div className="text-muted-foreground text-xs">Custom</div>
					<div className="text-2xl font-semibold">
						{categories.filter((c) => !c.system).length}
					</div>
				</div>
				<div className="rounded-none border border-border bg-background p-4">
					<div className="text-muted-foreground text-xs">Tax Rate Set</div>
					<div className="text-2xl font-semibold">
						{categories.filter((c) => c.taxRate !== null).length}
					</div>
				</div>
				<div className="rounded-none border border-border bg-background p-4">
					<div className="text-muted-foreground text-xs">System</div>
					<div className="text-2xl font-semibold">
						{categories.filter((c) => c.system).length}
					</div>
				</div>
			</div>

			<TransactionCategoryForm open={createOpen} onOpenChange={setCreateOpen} />
		</div>
	);
}
