"use client";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { TeamDropdown } from "./team-dropdown";
import UserMenu from "./user-menu";

export default function Header() {
	const links = [
		{ to: "/", label: "Home" },
		{ to: "/dashboard", label: "Dashboard" },
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<div className="flex items-center gap-4">
					<nav className="flex gap-4 text-lg">
						{links.map(({ to, label }) => {
							return (
								<Link href={to} key={to}>
									{label}
								</Link>
							);
						})}
					</nav>
					{/* Workspace switcher — shown only for authenticated users with an
					    active team.  Renders a static label for single-team users and a
					    dropdown for multi-team users (VAL-TENANCY-003). */}
					<TeamDropdown />
				</div>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}
