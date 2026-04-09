"use client";

import { Button } from "@faworra-new/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@faworra-new/ui/components/dialog";
import { Input } from "@faworra-new/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@faworra-new/ui/components/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/trpc/client";

const categorySchema = z.object({
	name: z.string().min(1, "Name is required"),
	color: z.string().default("#3b82f6"),
	// Note: 'kind' removed - categories no longer have kind field
	description: z.string().optional(),
	parentId: z.string().uuid().optional(),
	taxRate: z.number().optional(),
	taxType: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface TransactionCategoryFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function TransactionCategoryForm({
	open,
	onOpenChange,
}: TransactionCategoryFormProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [color, setColor] = useState("#3b82f6");
	const [description, setDescription] = useState("");

	const createMutation = useMutation(
		trpc.transactions.createCategory.mutationOptions({
			onSuccess: async () => {
				toast.success("Category created");
				await queryClient.invalidateQueries({
					queryKey: trpc.transactions.categories.queryKey(),
				});
				setName("");
				setColor("#3b82f6");
				setDescription("");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message || "Failed to create category");
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Generate slug from name
		const slug = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		createMutation.mutate({ name, color, slug, description: description || undefined });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Category</DialogTitle>
					<DialogDescription>
						Add a new category to organize your transactions.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Name</label>
						<Input
							placeholder="Category name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Description (optional)</label>
						<Input
							placeholder="Category description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Color</label>
						<div className="flex gap-2">
							<Input
								type="color"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className="w-12 h-10 p-1"
							/>
							<Input
								value={color}
								onChange={(e) => setColor(e.target.value)}
								placeholder="#3b82f6"
								className="flex-1"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createMutation.isPending || !name}>
							{createMutation.isPending ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
