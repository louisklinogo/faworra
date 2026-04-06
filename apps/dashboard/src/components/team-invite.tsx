"use client";

import type { AppRouter } from "@faworra-new/api/routers/index";
import { Button } from "@faworra-new/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { applyWorkspacePatchToViewer } from "@/lib/workspace-cache";
import { trpc } from "@/utils/trpc";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TeamInviteRecord = RouterOutputs["teamInvites"]["invitesByEmail"][number];

interface Props {
	invite: TeamInviteRecord;
}

/**
 * Individual pending invite card cloned from Midday's team-invite.tsx shape.
 *
 * Shows the team logo/initial, team name, and Accept / Decline actions.
 *
 * Accept flow:
 *   teamInvites.accept → workspace context is activated server-side →
 *   navigate to /dashboard (no separate switchTeam needed because acceptTeamInvite
 *   already writes the activeMembershipId to userContext).
 *
 * Decline flow:
 *   teamInvites.decline → invite is revoked → parent re-fetches invite list.
 */
export function TeamInvite({ invite }: Props) {
	const queryClient = useQueryClient();
	const router = useRouter();

	const acceptMutation = useMutation(
		trpc.teamInvites.accept.mutationOptions({
			onSuccess: (data) => {
				// Immediately write the accepted workspace into the viewer cache so
				// TeamDropdown in the destination /dashboard shell renders the
				// correct current-workspace indicator instead of the stale teamless
				// state (VAL-CROSS-007).  Without this pre-write, the Header's
				// TeamDropdown reads a stale cache and returns null while the RSC
				// body already shows the invited workspace.
				queryClient.setQueryData(trpc.viewer.queryKey(), (old) =>
					applyWorkspacePatchToViewer(old, data)
				);
				// Navigate to the dashboard — the viewer cache already reflects the
				// invited workspace so TeamDropdown won't flash a teamless null
				// state during the transition.
				router.push("/dashboard");
				// Background-invalidate everything so the server-confirmed workspace
				// state replaces the immediate pre-write above for full consistency,
				// and the RSC shell picks up the new active workspace.
				queryClient.invalidateQueries();
			},
		})
	);

	const declineMutation = useMutation(
		trpc.teamInvites.decline.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.teamInvites.invitesByEmail.queryKey(),
				});
			},
		})
	);

	const teamInitial = invite.team?.name?.charAt(0)?.toUpperCase() ?? "?";

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-4">
				{/* Team logo / fallback initial — Faworra has no Avatar component in
				    @faworra-new/ui, so we render a simple styled initial. */}
				<div className="flex size-8 shrink-0 items-center justify-center rounded-none border border-border bg-muted font-medium text-xs">
					{invite.team?.logoUrl ? (
						<Image
							alt={invite.team.name ?? "Team"}
							className="size-8 rounded-none object-cover"
							height={32}
							src={invite.team.logoUrl}
							width={32}
						/>
					) : (
						teamInitial
					)}
				</div>

				<span className="font-medium text-sm">{invite.team?.name}</span>
			</div>

			<div className="flex gap-2">
				<Button
					disabled={acceptMutation.isPending || declineMutation.isPending}
					onClick={() => acceptMutation.mutate({ inviteId: invite.id })}
					size="sm"
					variant="default"
				>
					{acceptMutation.isPending ? "Accepting…" : "Accept"}
				</Button>
				<Button
					disabled={acceptMutation.isPending || declineMutation.isPending}
					onClick={() => declineMutation.mutate({ inviteId: invite.id })}
					size="sm"
					variant="outline"
				>
					{declineMutation.isPending ? "Declining…" : "Decline"}
				</Button>
			</div>
		</div>
	);
}
