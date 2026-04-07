"use client";

import Link from "next/link";

import { LoginAccordion } from "@/components/login-accordion";
import { LoginVideoBackground } from "@/components/login-video-background";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function AuthScreen({ returnTo }: { returnTo?: string }) {
	return (
		<div className="relative flex min-h-screen bg-background">
			<nav className="pointer-events-none fixed top-0 right-0 left-0 z-50 w-full">
				<div className="relative flex items-center px-4 py-3 lg:px-6 2xl:px-8">
					<Link
						className="pointer-events-auto flex items-center gap-2 font-semibold text-sm transition-opacity duration-200 hover:opacity-80"
						href={{ pathname: "/" }}
					>
						<span className="flex h-6 w-6 items-center justify-center border border-border text-xs">
							F
						</span>
					</Link>
				</div>
			</nav>

			<LoginVideoBackground />

			<div className="flex w-full flex-col items-center justify-center p-8 pb-2 lg:w-1/2 lg:p-12">
				<div className="flex h-full w-full max-w-md flex-col">
					<div className="flex flex-1 flex-col justify-center space-y-8">
						<div className="space-y-2 text-center">
							<h1 className="mb-4 font-serif text-lg lg:text-xl">
								Welcome to Faworra
							</h1>
							<p className="font-sans text-[#878787] text-sm">
								Sign in or create an account
							</p>
						</div>

						<div className="flex w-full items-center justify-center">
							<SignInForm returnTo={returnTo} />
						</div>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-border border-t" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="bg-background px-2 font-sans text-[#878787]">
									or
								</span>
							</div>
						</div>

						<LoginAccordion>
							<SignUpForm />
						</LoginAccordion>
					</div>

					<div className="mt-auto text-center">
						<p className="font-sans text-[#878787] text-xs">
							By signing in you agree to our Terms of service & Privacy policy
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
