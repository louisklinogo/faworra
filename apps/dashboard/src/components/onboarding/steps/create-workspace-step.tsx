"use client";

import { onboardingInputSchema } from "@faworra-new/api/onboarding";
import { uniqueCurrencies } from "@faworra-new/location/currencies";
import { Input } from "@faworra-new/ui/components/input";
import { Label } from "@faworra-new/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CountrySelector } from "@/components/country-selector";
import { SelectCurrency } from "@/components/select-currency";
import { trpc } from "@/utils/trpc";

interface CreateWorkspaceStepProps {
	defaultCountryCode?: string;
	defaultCurrency?: string;
	onLoadingChange?: (loading: boolean) => void;
}

export function CreateWorkspaceStep({
	defaultCountryCode = "GH",
	defaultCurrency = "GHS",
	onLoadingChange,
}: CreateWorkspaceStepProps) {
	const router = useRouter();
	const completeOnboarding = useMutation(
		trpc.onboarding.complete.mutationOptions({
			onSettled: () => {
				onLoadingChange?.(false);
			},
		})
	);

	const form = useForm({
		defaultValues: {
			companyName: "",
			baseCurrency: defaultCurrency,
			countryCode: defaultCountryCode,
		},
		onSubmit: async ({ value }) => {
			try {
				onLoadingChange?.(true);
				await completeOnboarding.mutateAsync(value);
				toast.success("Your workspace is ready");
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
		validators: {
			onSubmit: onboardingInputSchema,
		},
	});

	return (
		<div className="space-y-4">
			<h1 className="font-serif text-lg lg:text-xl">Business details</h1>
			<p className="text-muted-foreground text-sm leading-relaxed">
				Add the core workspace details we need so your team, currency, and
				country settings are initialized correctly.
			</p>

			<form
				className="space-y-4"
				id="create-workspace-form"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
			>
				<form.Field
					name="companyName"
					validators={{
						onBlur: onboardingInputSchema.shape.companyName,
						onSubmit: onboardingInputSchema.shape.companyName,
					}}
				>
					{(field) => {
						const hasError = field.state.meta.errors.length > 0;
						const errorId = `${field.name}-error`;
						return (
							<div className="space-y-2">
								<Label
									className="font-normal text-primary text-xs"
									htmlFor={field.name}
								>
									Company name
								</Label>
								<Input
									aria-describedby={hasError ? errorId : undefined}
									aria-invalid={hasError}
									autoFocus
									className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Akwa Trading"
									value={field.state.value}
								/>
								{hasError ? (
									<p className="text-destructive text-sm" id={errorId}>
										{field.state.meta.errors[0]?.message}
									</p>
								) : null}
							</div>
						);
					}}
				</form.Field>

				<div className="grid gap-4 md:grid-cols-2">
					<form.Field
						name="countryCode"
						validators={{ onBlur: onboardingInputSchema.shape.countryCode }}
					>
						{(field) => (
							<div className="space-y-2">
								<Label
									className="font-normal text-primary text-xs"
									htmlFor={field.name}
								>
									Country
								</Label>
								<CountrySelector
									defaultValue={field.state.value}
									onSelect={(code) => {
										field.handleChange(code);
									}}
								/>
								{field.state.meta.errors.map((error) => (
									<p className="text-destructive text-sm" key={error?.message}>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field
						name="baseCurrency"
						validators={{ onBlur: onboardingInputSchema.shape.baseCurrency }}
					>
						{(field) => (
							<div className="space-y-2">
								<Label
									className="font-normal text-primary text-xs"
									htmlFor={field.name}
								>
									Base currency
								</Label>
								<SelectCurrency
									currencies={uniqueCurrencies}
									onChange={(value) => {
										field.handleChange(value);
									}}
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p className="text-destructive text-sm" key={error?.message}>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>
			</form>
		</div>
	);
}
