"use client";

import { Icons } from "@faworra-new/ui/components/icons";
import { cn } from "@faworra-new/ui/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useTabs } from "./tab-context";

const icons: Record<string, (props: { size: number }) => React.ReactNode> = {
	"/dashboard": (props) => <Icons.Overview {...props} />,
	"/reports": (props) => <Icons.Monitoring {...props} />,
	"/transactions": (props) => <Icons.Transactions {...props} />,
	"/inbox": (props) => <Icons.Inbox2 {...props} />,
	"/invoices": (props) => <Icons.Invoice {...props} />,
	"/tracker": (props) => <Icons.Tracker {...props} />,
	"/customers": (props) => <Icons.Customers {...props} />,
	"/vault": (props) => <Icons.Vault {...props} />,
	"/apps": (props) => <Icons.Apps {...props} />,
	"/settings": (props) => <Icons.Settings {...props} />,
};

export function TabBar() {
	const { tabs, removeTab } = useTabs();
	const router = useRouter();
	const pathname = usePathname();

	if (tabs.length === 0) {
		return null;
	}

	const handleTabClick = (path: string) => {
		router.push(path);
	};

	const handleClose = (e: React.MouseEvent, tabId: string) => {
		e.stopPropagation();

		// Navigate away from the closed tab's page so the sync effect
		// doesn't see it as a missing tab and re-add it.
		const tabToClose = tabs.find((t: any) => t.id === tabId);
		if (tabToClose) {
			const isCurrentPage = pathname === tabToClose.path;
			if (isCurrentPage) {
				const remainingTabs = tabs.filter((t: any) => t.id !== tabId);
				const nextPath = remainingTabs.at(-1)?.path ?? "/dashboard";
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				router.push(nextPath as any);
			}
		}

		removeTab(tabId);
	};

	return (
		<div className="flex h-[34px] items-stretch bg-transparent w-full border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
			{tabs.map((tab: any) => {
				const IconComp = icons[tab.path] ?? (() => <Icons.Settings size={14} />);
				const isActive = pathname.includes(tab.path);

				return (
					<div
						className={cn(
							"group relative flex items-center gap-2 px-4 text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap border-r border-[#e6e6e6] dark:border-[#1d1d1d]",
							isActive
								? "bg-background text-foreground border-b-2 border-b-foreground -mb-[1px]"
								: "text-[#888] hover:text-foreground hover:bg-[#f5f5f5] dark:text-[#555] dark:hover:text-white dark:hover:bg-[#1a1a1a] border-b-2 border-b-transparent -mb-[1px]"
						)}
						key={tab.id}
						onClick={() => handleTabClick(tab.path)}
						onKeyDown={(e: React.KeyboardEvent) => {
							if (e.key === "Enter" || e.key === " ") {
								handleTabClick(tab.path);
							}
						}}
						role="tab"
						tabIndex={0}
					>
						<span className={cn(
							"flex-shrink-0 transition-colors",
							isActive ? "text-black dark:text-white" : "text-[#888]"
						)}>
							<IconComp size={14} />
						</span>
						<span className="font-medium">{tab.label}</span>
						{!tab.isPinned && (
							<button
								className={cn(
									"ml-2 flex-shrink-0 rounded-none p-0.5 transition-all hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100",
									isActive && "opacity-60 hover:opacity-100"
								)}
								onClick={(e: React.MouseEvent) => handleClose(e, tab.id)}
								type="button"
							>
								<Icons.X size={12} />
							</button>
						)}
					</div>
				);
			})}
		</div>
	);
}
