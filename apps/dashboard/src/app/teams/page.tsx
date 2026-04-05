import { Button } from "@faworra-new/ui/components/button";
import { Skeleton } from "@faworra-new/ui/components/skeleton";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TeamInvites } from "@/components/team-invites";
import UserMenu from "@/components/user-menu";
import { createServerTrpcClient } from "@/lib/server-trpc";
import { getServerViewer } from "@/lib/server-viewer";

export const metadata: Metadata = {
	title: "Teams | Faworra",
};

/**
 * Invite-recovery surface for authenticated users without a usable workspace.
 *
 * Mirrors Midday's `/teams` page shape:
 * - Shows pending invites the signed-in email has received.
 * - If the user has neither accepted memberships nor pending invites, redirects
 *   immediately to /onboarding for default-team bootstrap.
 * - If the user already has an active workspace (should not normally land here),
 *   redirects to /dashboard.
 *
 * Route protection layers:
 * 1. proxy.ts (edge) — guests redirected to /login before reaching this page.
 * 2. This server component — validates session and workspace state, then
 *    performs the no-invites → /onboarding redirect server-side so the user
 *    never sees a flash of the invite UI when there is nothing to show.
 */
export default async function TeamsPage() {
	const viewer = await getServerViewer();

	// Guests should not reach this page — the proxy redirects them — but defend
	// here too so the page is safe even if the middleware is bypassed.
	if (!viewer.isAuthenticated) {
		redirect("/login?return_to=%2Fteams");
	}

	// A user with a ready workspace shouldn't land on the recovery surface.
	if (viewer.activeTeam) {
		redirect("/dashboard");
	}

	// Fetch the signed-in user's pending invites server-side so we can redirect
	// immediately (no client flash) when there are none.
	const trpcClient = await createServerTrpcClient();
	const invites = await trpcClient.teamInvites.invitesByEmail.query();

	if (!invites.length) {
		// No invites — fall through to default-team onboarding.
		redirect("/onboarding");
	}

	const firstName = viewer.user?.name?.split(" ").at(0) ?? "there";

	return (
		<div className="relative flex min-h-screen flex-col">
			{/* Header — sign-out only, no back navigation */}
			<header className="absolute top-0 right-0 left-0 flex w-full items-center justify-between">
				<div className="p-6">
					<Link className="font-semibold text-sm" href="/">
						Faworra
					</Link>
				</div>

				<div className="mt-4 mr-6">
					<UserMenu />
				</div>
			</header>

			<div className="flex min-h-screen items-center justify-center overflow-hidden p-6 md:p-0">
				<div className="relative z-20 m-auto flex w-full max-w-[480px] flex-col">
					<div className="text-center">
						<h1 className="mb-2 font-serif text-lg lg:text-xl">
							Welcome, {firstName}
						</h1>
						<p className="mb-8 text-[#878787] text-sm">
							Join a team you've been invited to or create a new one.
						</p>
					</div>

					{/* Invite list — fetches live data on the client so that accept /
					    decline mutations instantly update without a full page reload. */}
					<Suspense
						fallback={
							<div className="mt-4 space-y-4">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-12 w-full" />
							</div>
						}
					>
						<TeamInvites />
					</Suspense>

					<div className="relative mt-12 w-full border-border border-t border-dashed pt-6 text-center">
						<span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-4 text-[#878787] text-sm">
							Or
						</span>
						<Link className="w-full" href="/onboarding">
							<Button className="mt-2 w-full" variant="outline">
								Create team
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
