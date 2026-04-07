import { Button } from "@faworra-new/ui/components/button";
import { Input } from "@faworra-new/ui/components/input";
import { Label } from "@faworra-new/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { getSafeReturnTo } from "@/lib/return-to";

import Loader from "./loader";

export default function SignInForm({ returnTo }: { returnTo?: string }) {
	const { isPending } = authClient.useSession();
	const safeReturnTo = getSafeReturnTo(returnTo);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						window.location.assign(safeReturnTo);
						toast.success("Sign in successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<form
			className="w-full space-y-4"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<div>
				<form.Field name="email">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Email</Label>
							<Input
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								type="email"
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

			<div>
				<form.Field name="password">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Password</Label>
							<Input
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								type="password"
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

			<form.Subscribe
				selector={(state) => ({
					canSubmit: state.canSubmit,
					isSubmitting: state.isSubmitting,
				})}
			>
				{({ canSubmit, isSubmitting }) => (
					<Button
						className="w-full"
						disabled={!canSubmit || isSubmitting}
						type="submit"
					>
						{isSubmitting ? "Submitting..." : "Sign In"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
