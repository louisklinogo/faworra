"use client";

import { Avatar, AvatarFallback } from "@faworra-new/ui/components/avatar";
import { Button } from "@faworra-new/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@faworra-new/ui/components/dropdown-menu";
import { Icons } from "@faworra-new/ui/components/icons";
import { Skeleton } from "@faworra-new/ui/components/skeleton";
import { cn } from "@faworra-new/ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export default function UserMenu({
	isExpanded = false,
}: {
	isExpanded?: boolean;
}) {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const { data: viewer, isLoading: viewerLoading } = useQuery(
		trpc.viewer.queryOptions()
	);

	const isAuthenticated = viewer?.isAuthenticated === true;

	// Fetch memberships (accepted)
	const { data: teams, isLoading: teamsLoading } = useQuery({
		...trpc.team.list.queryOptions(),
		enabled: isAuthenticated,
	});

	// Fetch pending invites for the user's email
	const { data: pendingInvites } = useQuery({
		...trpc.teamInvites.invitesByEmail.queryOptions(),
		enabled: isAuthenticated && !!session?.user.email,
	});

	const switchTeamMutation = useMutation(
		trpc.user.switchTeam.mutationOptions({
			onSuccess: () => {
				window.location.reload(); // Hard reload to ensure all contexts reset correctly
			},
		})
	);

	const isPending = sessionPending || viewerLoading || teamsLoading;

	if (isPending) {
		return <Skeleton className="h-8 w-full rounded-none" />;
	}

	if (!session || !viewer) {
		return (
			<Link href="/login">
				<Button variant="outline" className="w-full h-8">
					Sign In
				</Button>
			</Link>
		);
	}

	const activeTeam = viewer.activeTeam;
	const activeMembership = viewer.membership;
	const role = activeMembership?.role;

	// Categorize teams
	const ownedTeams = teams?.filter((t) => t.role === "owner" || t.role === "admin") ?? [];
	const collaborationTeams = teams?.filter((t) => t.role === "accountant" || t.role === "member") ?? [];

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					className={cn(
						"group flex w-full items-center gap-2 rounded-none hover:bg-accent transition-colors text-left outline-none",
						isExpanded ? "justify-between px-2 py-1.5" : "justify-center p-0"
					)}
					type="button"
				>
					<div className="flex items-center gap-2 min-w-0">
						<Avatar className="h-5 w-5 rounded-none">
							<AvatarFallback className="rounded-none bg-primary text-[10px] text-primary-foreground font-bold">
								{activeTeam?.name?.charAt(0).toUpperCase() ?? "F"}
							</AvatarFallback>
						</Avatar>
						{isExpanded && (
							<div className="flex flex-col min-w-0">
								<span className="truncate text-sm font-semibold text-foreground leading-tight">
									{activeTeam?.name ?? "Select Workspace"}
								</span>
								<span className="text-[10px] text-muted-foreground capitalize">
									{role ?? "Guest"}
								</span>
							</div>
						)}
					</div>
					{isExpanded && (
						<Icons.ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0" />
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-[230px] p-1 shadow-lg border border-border/50"
				sideOffset={10}
			>
				<div className="px-2 py-2">
					<p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
						Personal
					</p>
					<div className="flex flex-col gap-0.5">
						<span className="text-sm font-medium text-foreground truncate">
							{session.user.email}
						</span>
						<Link href="/account" className="text-xs text-primary hover:underline mt-1 inline-block">
							Manage account
						</Link>
					</div>
				</div>

				{pendingInvites && pendingInvites.length > 0 && (
					<>
						<DropdownMenuSeparator />
						<div className="px-2 py-1.5">
							<p className="text-[10px] font-medium text-orange-500 uppercase tracking-wider mb-1 flex items-center gap-1">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
								</span>
								Pending Invitations
							</p>
							<div className="flex flex-col gap-1 mt-1">
								{pendingInvites.map((invite) => (
									<Link
										key={invite.id}
										href={`/onboarding?inviteId=${invite.id}`}
										className="text-xs p-1.5 rounded-none bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 transition-colors border border-orange-100 dark:border-orange-900/30"
									>
										Invite to <span className="font-semibold">{invite.team?.name}</span>
									</Link>
								))}
							</div>
						</div>
					</>
				)}

				<DropdownMenuSeparator />

				<div className="max-h-[300px] overflow-y-auto">
					{ownedTeams.length > 0 && (
						<div className="px-1 py-1.5">
							<p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
								Your Businesses
							</p>
							{ownedTeams.map((team) => (
								<DropdownMenuItem
									key={team.membershipId}
									className={cn(
										"text-xs cursor-pointer justify-between",
										team.teamId === activeTeam?.id && "bg-accent font-medium"
									)}
									onClick={() => switchTeamMutation.mutate({ membershipId: team.membershipId })}
								>
									<span className="truncate pr-2">{team.name}</span>
									<div className="flex items-center gap-1.5">
										<span className="text-[11px] opacity-60 capitalize">{team.role}</span>
										{team.teamId === activeTeam?.id && (
											<Icons.Check className="h-3 w-3 text-primary" />
										)}
									</div>
								</DropdownMenuItem>
							))}
						</div>
					)}

					{collaborationTeams.length > 0 && (
						<div className="px-1 py-1.5">
							<p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
								Collaborations
							</p>
							{collaborationTeams.map((team) => (
								<DropdownMenuItem
									key={team.membershipId}
									className={cn(
										"text-xs cursor-pointer justify-between",
										team.teamId === activeTeam?.id && "bg-accent font-medium"
									)}
									onClick={() => switchTeamMutation.mutate({ membershipId: team.membershipId })}
								>
									<span className="truncate">{team.name}</span>
									<div className="flex items-center gap-2">
										<span className="text-[10px] opacity-50 capitalize">{team.role}</span>
										{team.teamId === activeTeam?.id && (
											<Icons.Check className="h-3 w-3 text-primary" />
										)}
									</div>
								</DropdownMenuItem>
							))}
						</div>
					)}
				</div>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<Link href="/onboarding">
						<DropdownMenuItem className="text-xs cursor-pointer text-primary font-medium focus:text-primary">
							<Icons.Plus size={14} className="mr-2" />
							Create a new workspace
						</DropdownMenuItem>
					</Link>
					<DropdownMenuItem
						className="text-xs text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										window.location.assign("/login");
									},
								},
							});
						}}
					>
						<Icons.LogOut size={14} className="mr-2" />
						Log out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
