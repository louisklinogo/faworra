"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Icons } from "@faworra-new/ui/components/icons";
import { TabBar } from "./tab-bar";

export function Header() {
	return (
		<header className="sticky top-0 z-50 flex h-[34px] shrink-0 items-center border-b border-[#e6e6e6] dark:border-[#1d1d1d] bg-background">
			<TabBar />
		</header>
	);
}
