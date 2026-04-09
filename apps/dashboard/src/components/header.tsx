"use client";

import { TabBar } from "./tab-bar";

export function Header() {
	return (
		<header className="sticky top-0 z-50 flex h-[34px] shrink-0 items-center border-[#e6e6e6] border-b bg-background dark:border-[#1d1d1d]">
			<TabBar />
		</header>
	);
}
