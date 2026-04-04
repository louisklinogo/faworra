"use client";

import { onboardingInputSchema } from "@faworra-new/api/onboarding";
import { Button } from "@faworra-new/ui/components/button";
import { Input } from "@faworra-new/ui/components/input";
import { Label } from "@faworra-new/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export default function OnboardingForm() {
	const router = useRouter();
	const completeOnboarding = useMutation(
		trpc.onboarding.complete.mutationOptions()
	);

	const form = useForm({
		defaultValues: {
			companyName: "",
			baseCurrency: "",
			countryCode: "",
		},
		validators: {
			onSubmit: onboardingInputSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await completeOnboarding.mutateAsync(value);
				toast.success("Your fashion workspace is ready");
				router.push("/dashboard");
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "We could not finish setting up your workspace";
				toast.error(message);
			}
		},
	});

	return (
		<div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-xl flex-col justify-center px-6 py-10">
			<div className="mb-8 space-y-3">
				<p className="font-medium text-sm text-zinc-500 uppercase tracking-[0.2em]">
					Faworra for fashion businesses
				</p>
				<h1 className="font-semibold text-3xl tracking-tight">
					Set up your brand workspace
				</h1>
				<p className="max-w-lg text-muted-foreground text-sm">
					We’ll use this to create your team, owner access, and your first
					fashion workspace settings.
				</p>
			</div>

			<form
				className="space-y-5"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
			>
				<div className="rounded-lg border bg-card p-4 text-sm">
					<p className="font-medium">Industry focus</p>
					<p className="mt-1 text-muted-foreground">
						This Phase 1 workspace is intentionally configured for fashion.
					</p>
				</div>

				<form.Field
					name="companyName"
					validators={{ onBlur: onboardingInputSchema.shape.companyName }}
				>
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Brand or company name</Label>
							<Input
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder="Afi Threads"
								value={field.state.value}
							/>
							{field.state.meta.errors.map((error) => (
								<p className="text-red-500 text-sm" key={error?.message}>
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				<div className="grid gap-5 md:grid-cols-2">
					<form.Field
						name="baseCurrency"
						validators={{ onBlur: onboardingInputSchema.shape.baseCurrency }}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Base currency</Label>
								<Input
									id={field.name}
									maxLength={3}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) =>
										field.handleChange(event.target.value.toUpperCase())
									}
									placeholder="GHS"
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p className="text-red-500 text-sm" key={error?.message}>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field
						name="countryCode"
						validators={{ onBlur: onboardingInputSchema.shape.countryCode }}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Country code</Label>
								<Input
									id={field.name}
									maxLength={2}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) =>
										field.handleChange(event.target.value.toUpperCase())
									}
									placeholder="GH"
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p className="text-red-500 text-sm" key={error?.message}>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							className="w-full"
							disabled={
								!canSubmit || isSubmitting || completeOnboarding.isPending
							}
							type="submit"
						>
							{isSubmitting || completeOnboarding.isPending
								? "Creating workspace..."
								: "Create fashion workspace"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
