"use client";

import { Button } from "@faworra-new/ui/components/button";
import Link from "next/link";
import { useMemo, useState } from "react";

import { OnboardingUserMenu } from "./onboarding-user-menu";
import { CreateWorkspaceStep } from "./steps/create-workspace-step";

interface OnboardingPageProps {
	defaultCountryCode: string;
	defaultCurrency: string;
	hasOtherTeams: boolean;
}

function DashboardPreview() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<div className="w-full max-w-[520px] rotate-[-2deg] border border-border bg-background shadow-2xl shadow-black/10">
				<div className="border-border border-b bg-muted/50 px-5 py-4">
					<div className="flex items-center justify-between">
						<p className="font-medium text-sm">Workspace overview</p>
						<div className="h-2 w-16 bg-border" />
					</div>
				</div>

				<div className="grid gap-4 p-5">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-3 border border-border p-4">
							<div className="h-3 w-20 bg-border" />
							<div className="h-8 w-32 bg-border" />
						</div>
						<div className="space-y-3 border border-border p-4">
							<div className="h-3 w-24 bg-border" />
							<div className="h-8 w-28 bg-border" />
						</div>
					</div>

					<div className="border border-border">
						<div className="grid grid-cols-3 border-border border-b bg-muted/30 px-4 py-3">
							<div className="h-3 w-20 bg-border" />
							<div className="h-3 w-16 bg-border" />
							<div className="h-3 w-12 bg-border" />
						</div>
						{["row-1", "row-2", "row-3", "row-4"].map((rowKey) => (
							<div
								className="grid grid-cols-3 border-border border-b px-4 py-4 last:border-b-0"
								key={rowKey}
							>
								<div className="h-3 w-24 bg-border" />
								<div className="h-3 w-10 bg-border" />
								<div className="h-3 w-16 bg-border" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function ProgressBar() {
	return (
		<div className="flex justify-center">
			<div className="h-1 w-32 overflow-hidden bg-border">
				<div className="h-full w-full bg-primary" />
			</div>
		</div>
	);
}

export function OnboardingPage({
	defaultCountryCode,
	defaultCurrency,
	hasOtherTeams,
}: OnboardingPageProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const currentStep = useMemo(
		() => ({
			content: (
				<CreateWorkspaceStep
					defaultCountryCode={defaultCountryCode}
					defaultCurrency={defaultCurrency}
					onLoadingChange={setIsSubmitting}
				/>
			),
			key: "create-workspace",
		}),
		[defaultCountryCode, defaultCurrency]
	);

	return (
		<div className="relative flex h-screen overflow-hidden">
			<nav className="pointer-events-none fixed top-0 right-0 left-0 z-50 w-full">
				<div className="relative flex items-center justify-between px-4 py-3 lg:px-6 2xl:px-8">
					<div className="flex items-center gap-3">
						<Link
							className="pointer-events-auto flex items-center gap-2 font-semibold text-sm transition-opacity duration-200 hover:opacity-80"
							href={{ pathname: "/" }}
						>
							<span className="flex h-6 w-6 items-center justify-center border border-border text-xs">
								F
							</span>
						</Link>

						{hasOtherTeams ? (
							<Link
								className="pointer-events-auto text-muted-foreground text-xs transition-colors hover:text-foreground"
								href="/teams"
							>
								Select team
							</Link>
						) : null}
					</div>

					<div className="pointer-events-auto">
						<OnboardingUserMenu />
					</div>
				</div>
			</nav>

			<div className="relative m-2 hidden items-center justify-center overflow-hidden bg-[#f7f7f7] p-8 lg:flex lg:w-1/2 dark:bg-[#080808]">
				<DashboardPreview />
				<div
					className="pointer-events-none absolute inset-0 dark:hidden"
					style={{
						background:
							"linear-gradient(to right, transparent 0%, transparent 45%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0.55) 85%, rgba(255,255,255,0.82) 100%)",
					}}
				/>
				<div
					className="pointer-events-none absolute inset-0 hidden dark:block"
					style={{
						background:
							"linear-gradient(to right, transparent 0%, transparent 45%, rgba(8,8,8,0.2) 70%, rgba(8,8,8,0.55) 85%, rgba(8,8,8,0.82) 100%)",
					}}
				/>
			</div>

			<div className="flex w-full flex-col items-center px-8 pt-10 text-foreground lg:w-1/2 lg:p-12 dark:bg-[#0c0c0c]">
				<div className="relative flex h-full w-full max-w-md flex-col">
					<div className="mb-2 h-6">
						<ProgressBar />
					</div>

					<div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto pt-20">
						{currentStep.content}
					</div>

					<div className="mt-auto pt-8">
						<div className="flex justify-end">
							<Button
								className="px-4 py-2 font-medium text-sm transition-colors"
								disabled={isSubmitting}
								form={`${currentStep.key}-form`}
								type="submit"
							>
								{isSubmitting ? "Creating workspace..." : "Continue"}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
