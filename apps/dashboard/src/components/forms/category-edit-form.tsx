"use client";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@faworra-new/ui/components/form";
import { Input } from "@faworra-new/ui/components/input";
import { SubmitButton } from "@faworra-new/ui/components/submit-button";
import { Switch } from "@faworra-new/ui/components/switch";
import { taxTypes } from "@faworra-new/utils/tax";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import { InputColor } from "@/components/input-color";
import { SelectParentCategory } from "@/components/select-parent-category";
import { SelectTaxType } from "@/components/select-tax-type";
import { TaxRateInput } from "@/components/tax-rate-input";
import { useCategoryParams } from "@/hooks/use-category-params";
import { useInvalidateTransactionQueries } from "@/hooks/use-invalidate-transaction-queries";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/utils/trpc";

const formSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, "Name is required"),
	description: z.string().optional().nullable(),
	color: z.string().optional().nullable(),
	taxRate: z.number().optional().nullable(),
	taxType: z.string().optional().nullable(),
	taxReportingCode: z.string().optional().nullable(),
	excluded: z.boolean().optional().nullable(),
	parentId: z.string().optional().nullable(),
});

type UpdateCategoriesFormValues = z.infer<typeof formSchema>;

type Props = {
	data?: RouterOutputs["transactions"]["getCategoryById"];
};

export function CategoryEditForm({ data }: Props) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { setParams } = useCategoryParams();
	const invalidateTransactionQueries = useInvalidateTransactionQueries();

	const defaultValues = {
		id: data?.id,
		name: data?.name || "",
		description: data?.description || "",
		color: data?.color || "",
		taxRate: data?.taxRate ?? undefined,
		taxType: data?.taxType || "",
		taxReportingCode: data?.taxReportingCode || "",
		excluded: data?.excluded,
		parentId: data?.parentId || undefined,
	};

	const form = useZodForm(formSchema, {
		defaultValues,
	});

	useEffect(() => {
		form.reset(defaultValues);
	}, [data, form]);

	const updateCategoryMutation = useMutation(
		trpc.transactions.updateCategory.mutationOptions({
			onSuccess: (_, variables) => {
				// Always invalidate category queries
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.categories.queryKey(),
				});

				// Check if excluded or taxRate changed (affects calculations)
				const excludedChanged = data?.excluded !== variables.excluded;
				const taxRateChanged = data?.taxRate !== variables.taxRate;

				if (excludedChanged || taxRateChanged) {
					invalidateTransactionQueries();
				}

				setParams(null);
			},
		})
	);

	function onSubmit(values: UpdateCategoriesFormValues) {
		const payload: {
			id: string;
			name: string;
			description: string | null;
			color: string | null;
			taxRate: number | null;
			taxType: string | null;
			taxReportingCode: string | null;
			excluded: boolean | null;
			parentId?: string | null;
		} = {
			id: values.id,
			name: values.name,
			description: values.description || null,
			color: values.color || null,
			taxRate: values.taxRate ?? null,
			taxType: values.taxType || null,
			taxReportingCode: values.taxReportingCode || null,
			excluded: values.excluded ?? null,
		};

		// Only include parentId if it has changed from the original value
		// Normalize null and undefined to be treated as equivalent
		const currentParentId = data?.parentId ?? undefined;
		const newParentId = values.parentId ?? undefined;

		if (newParentId !== currentParentId) {
			payload.parentId = values.parentId ?? null;
		}

		updateCategoryMutation.mutate(payload);
	}

	return (
		<Form {...form}>
			<form
				className="flex h-[calc(100vh-130px)] flex-col space-y-6"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<div className="flex flex-col space-y-6 overflow-auto">
					<div className="flex flex-col space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel className="font-normal text-[#878787] text-xs">
										Name
									</FormLabel>
									<FormControl>
										<InputColor
											autoFocus
											defaultColor={form.watch("color") ?? undefined}
											defaultValue={field.value}
											onChange={({ name, color }) => {
												field.onChange(name);
												form.setValue("color", color);
											}}
											placeholder="Name"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="parentId"
							render={({ field }) => {
								const hasChildren = data?.children && data.children.length > 0;

								return (
									<FormItem className="space-y-1">
										<FormLabel className="font-normal text-[#878787] text-xs">
											Parent Category (Optional)
										</FormLabel>
										<FormControl>
											{hasChildren ? (
												<div className="flex items-center space-x-2 border border-border bg-muted/50 p-3 py-2">
													<span className="text-muted-foreground text-sm">
														Cannot change parent - this category has children
													</span>
												</div>
											) : (
												<SelectParentCategory
													excludeIds={data?.id ? [data.id] : []}
													onChange={(parent) => {
														field.onChange(parent?.id ?? undefined);
													}}
													parentId={field.value}
												/>
											)}
										</FormControl>
									</FormItem>
								);
							}}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel className="font-normal text-[#878787] text-xs">
										Description
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											autoFocus={false}
											placeholder="Description"
											value={field.value || ""}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="taxReportingCode"
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel className="font-normal text-[#878787] text-xs">
										Report Code
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											autoFocus={false}
											placeholder="Report Code"
											value={field.value || ""}
										/>
									</FormControl>
									<p className="pt-1 text-muted-foreground text-xs">
										Maps to account codes when exporting to accounting software
									</p>
								</FormItem>
							)}
						/>
					</div>

					<div>
						<div className="relative flex gap-2">
							<FormField
								control={form.control}
								name="taxType"
								render={({ field }) => (
									<FormItem className="w-[300px] space-y-1">
										<FormLabel className="font-normal text-[#878787] text-xs">
											Tax Type
										</FormLabel>
										<FormControl>
											<SelectTaxType
												onChange={(value) => {
													field.onChange(value);
												}}
												value={field.value ?? ""}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="taxRate"
								render={({ field }) => (
									<FormItem className="flex-1 space-y-1">
										<FormLabel className="font-normal text-[#878787] text-xs">
											Tax Rate
										</FormLabel>
										<FormControl>
											<TaxRateInput
												isNewProduct={false}
												name={form.watch("name") ?? ""}
												onChange={(value: string) => {
													field.onChange(value ? Number(value) : undefined);
												}}
												onSelect={(taxRate) => {
													if (taxRate) {
														field.onChange(taxRate);
													}
												}}
												value={field.value}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="relative mt-2 flex gap-2">
							<span className="flex-1 text-muted-foreground text-xs">
								{
									taxTypes.find(
										(taxType) => taxType.value === form.watch("taxType")
									)?.description
								}
							</span>
						</div>
					</div>

					<FormField
						control={form.control}
						name="excluded"
						render={({ field }) => (
							<FormItem className="flex-1 space-y-1">
								<div className="mt-2 border border-border p-3 pt-1.5">
									<div className="flex items-center justify-between space-x-2">
										<div className="space-y-0.5">
											<FormLabel className="font-normal text-[#878787] text-xs">
												Exclude from reports
											</FormLabel>
											<div className="text-muted-foreground text-xs">
												Transactions in this category won't appear in financial
												reports
											</div>
										</div>
										<FormControl>
											<Switch
												checked={field.value ?? false}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</div>
								</div>
							</FormItem>
						)}
					/>
				</div>

				<div className="flex-1" />
				<div className="mt-auto border-t pt-6">
					<SubmitButton
						className="w-full"
						isSubmitting={updateCategoryMutation.isPending}
					>
						Update
					</SubmitButton>
				</div>
			</form>
		</Form>
	);
}
