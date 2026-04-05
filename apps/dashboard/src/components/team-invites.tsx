"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { trpc } from "@/utils/trpc";

import { TeamInvite } from "./team-invite";

/**
 * Invite list for the teams/invite-recovery surface.
 *
 * Cloned from Midday's TeamInvites component shape, adapted for Faworra:
 * - Uses `trpc.teamInvites.invitesByEmail` (Faworra's router path) instead
 *   of Midday's `trpc.team.invitesByEmail`.
 * - Detects when all invites have been declined and redirects to /onboarding
 *   so the user can complete the default-team bootstrap.
 */
export function TeamInvites() {
	const router = useRouter();
	const { data: invites } = useSuspenseQuery(
		trpc.teamInvites.invitesByEmail.queryOptions()
	);

	// When the invite list drops to zero (i.e. the user declined all invites),
	// redirect to /onboarding.  The initial server-side render already
	// guaranteed at least one invite existed when the page was first loaded;
	// this effect fires only after client-side mutations exhaust the list.
	useEffect(() => {
		if (invites.length === 0) {
			router.push("/onboarding");
		}
	}, [invites.length, router]);

	if (invites.length === 0) {
		return null;
	}

	return (
		<div className="mt-4">
			<span className="mb-4 text-[#878787] text-sm">Invitations</span>

			<div className="mt-6 space-y-4">
				{invites.map((invite) => (
					<TeamInvite invite={invite} key={invite.id} />
				))}
			</div>
		</div>
	);
}
