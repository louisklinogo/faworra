"use client";

import { Avatar, AvatarFallback } from "@faworra-new/ui/components/avatar";
import { Button } from "@faworra-new/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
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
import { ThemeSwitch } from "./theme-switch";

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

	if (!(session && viewer)) {
		return (
			<Link href="/login">
				<Button className="h-8 w-full" variant="outline">
					Sign In
				</Button>
			</Link>
		);
	}

	const activeTeam = viewer.activeTeam;
	const activeMembership = viewer.membership;
	const role = activeMembership?.role;

	// Categorize teams
	const ownedTeams =
		teams?.filter((t) => t.role === "owner" || t.role === "admin") ?? [];
	const collaborationTeams =
		teams?.filter((t) => t.role === "accountant" || t.role === "member") ?? [];

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					className={cn(
						"group flex w-full items-center gap-2 rounded-none text-left outline-none transition-colors hover:bg-accent",
						isExpanded ? "justify-between px-2 py-1.5" : "justify-center p-0"
					)}
					type="button"
				>
					<div className="flex min-w-0 items-center gap-2">
						<Avatar className="h-5 w-5 rounded-none">
							<AvatarFallback className="rounded-none bg-primary font-bold text-[10px] text-primary-foreground">
								{activeTeam?.name?.charAt(0).toUpperCase() ?? "F"}
							</AvatarFallback>
						</Avatar>
						{isExpanded && (
							<div className="flex min-w-0 flex-col">
								<span className="truncate font-semibold text-foreground text-sm leading-tight">
									{activeTeam?.name ?? "Select Workspace"}
								</span>
								<span className="text-[10px] text-muted-foreground capitalize">
									{role ?? "Guest"}
								</span>
							</div>
						)}
					</div>
					{isExpanded && (
						<Icons.ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-[230px] border border-border/50 p-1 shadow-lg"
				sideOffset={10}
			>
				<div className="px-2 py-2">
					<p className="mb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
						Personal
					</p>
					<div className="flex flex-col gap-0.5">
						<span className="truncate font-medium text-foreground text-sm">
							{session.user.email}
						</span>
						<Link
							className="mt-1 inline-block text-primary text-xs hover:underline"
							href="/account"
						>
							Manage account
						</Link>
					</div>
				</div>

				{pendingInvites && pendingInvites.length > 0 && (
					<>
						<DropdownMenuSeparator />
						<div className="px-2 py-1.5">
							<p className="mb-1 flex items-center gap-1 font-medium text-[10px] text-orange-500 uppercase tracking-wider">
								<span className="relative flex h-2 w-2">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
									<span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
								</span>
								Pending Invitations
							</p>
							<div className="mt-1 flex flex-col gap-1">
								{pendingInvites.map((invite) => (
									<Link
										className="rounded-none border border-orange-100 bg-orange-50 p-1.5 text-xs transition-colors hover:bg-orange-100 dark:border-orange-900/30 dark:bg-orange-950/20"
										href={`/onboarding?inviteId=${invite.id}`}
										key={invite.id}
									>
										Invite to{" "}
										<span className="font-semibold">{invite.team?.name}</span>
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
							<p className="px-2 py-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
								Your Businesses
							</p>
							{ownedTeams.map((team) => (
								<DropdownMenuItem
									className={cn(
										"cursor-pointer justify-between text-xs",
										team.teamId === activeTeam?.id && "bg-accent font-medium"
									)}
									key={team.membershipId}
									onClick={() =>
										switchTeamMutation.mutate({
											membershipId: team.membershipId,
										})
									}
								>
									<span className="truncate pr-2">{team.name}</span>
									<div className="flex items-center gap-1.5">
										<span className="text-[11px] capitalize opacity-60">
											{team.role}
										</span>
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
							<p className="px-2 py-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
								Collaborations
							</p>
							{collaborationTeams.map((team) => (
								<DropdownMenuItem
									className={cn(
										"cursor-pointer justify-between text-xs",
										team.teamId === activeTeam?.id && "bg-accent font-medium"
									)}
									key={team.membershipId}
									onClick={() =>
										switchTeamMutation.mutate({
											membershipId: team.membershipId,
										})
									}
								>
									<span className="truncate">{team.name}</span>
									<div className="flex items-center gap-2">
										<span className="text-[10px] capitalize opacity-50">
											{team.role}
										</span>
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

				<div className="px-2 py-1">
					<ThemeSwitch />
				</div>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<Link href="/onboarding">
						<DropdownMenuItem className="cursor-pointer font-medium text-primary text-xs focus:text-primary">
							<Icons.Plus className="mr-2" size={14} />
							Create a new workspace
						</DropdownMenuItem>
					</Link>
					<DropdownMenuItem
						className="cursor-pointer text-destructive text-xs focus:bg-destructive/10 focus:text-destructive"
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
						<Icons.LogOut className="mr-2" size={14} />
						Log out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
