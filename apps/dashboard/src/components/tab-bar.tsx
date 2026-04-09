"use client";

import { Icons } from "@faworra-new/ui/components/icons";
import { cn } from "@faworra-new/ui/lib/utils";
import { usePathname, useRouter } from "next/navigation";

import { type TabItem, useTabs } from "./tab-context";

const icons: Record<string, (props: { size: number }) => React.ReactNode> = {
	"/apps": (props) => <Icons.Apps {...props} />,
	"/customers": (props) => <Icons.Customers {...props} />,
	"/dashboard": (props) => <Icons.Overview {...props} />,
	"/inbox": (props) => <Icons.Inbox2 {...props} />,
	"/invoices": (props) => <Icons.Invoice {...props} />,
	"/reports": (props) => <Icons.Monitoring {...props} />,
	"/settings": (props) => <Icons.Settings {...props} />,
	"/tracker": (props) => <Icons.Tracker {...props} />,
	"/transactions": (props) => <Icons.Transactions {...props} />,
	"/vault": (props) => <Icons.Vault {...props} />,
};

export function TabBar() {
	const { tabs, removeTab } = useTabs();
	const router = useRouter();
	const pathname = usePathname();

	if (tabs.length === 0) {
		return null;
	}

	const handleTabClick = (path: string) => {
		router.push(path as never);
	};

	const handleClose = (event: React.MouseEvent, tabId: string) => {
		event.stopPropagation();

		const tabToClose = tabs.find((tab) => tab.id === tabId);
		if (tabToClose && pathname === tabToClose.path) {
			const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
			const nextPath = remainingTabs.at(-1)?.path ?? "/dashboard";
			router.push(nextPath as never);
		}

		removeTab(tabId);
	};

	return (
		<div className="flex h-[34px] w-full items-stretch border-[#e6e6e6] border-b bg-transparent dark:border-[#1d1d1d]">
			{tabs.map((tab: TabItem) => {
				const IconComp =
					icons[tab.path] ?? (() => <Icons.Settings size={14} />);
				const isActive = pathname.includes(tab.path);

				return (
					<div
						className={cn(
							"group relative flex cursor-pointer items-center gap-2 whitespace-nowrap border-[#e6e6e6] border-r px-4 font-medium text-[13px] transition-all dark:border-[#1d1d1d]",
							isActive
								? "-mb-[1px] border-b-2 border-b-foreground bg-background text-foreground"
								: "-mb-[1px] border-b-2 border-b-transparent text-[#888] hover:bg-[#f5f5f5] hover:text-foreground dark:text-[#555] dark:hover:bg-[#1a1a1a] dark:hover:text-white"
						)}
						key={tab.id}
						onClick={() => handleTabClick(tab.path)}
						onKeyDown={(event: React.KeyboardEvent) => {
							if (event.key === "Enter" || event.key === " ") {
								handleTabClick(tab.path);
							}
						}}
						role="tab"
						tabIndex={0}
					>
						<span
							className={cn(
								"flex-shrink-0 transition-colors",
								isActive ? "text-black dark:text-white" : "text-[#888]"
							)}
						>
							<IconComp size={14} />
						</span>
						<span className="font-medium">{tab.label}</span>
						{tab.isPinned ? null : (
							<button
								className={cn(
									"ml-2 flex-shrink-0 rounded-none p-0.5 opacity-0 transition-all hover:bg-black/5 group-hover:opacity-100 dark:hover:bg-white/10",
									isActive && "opacity-60 hover:opacity-100"
								)}
								onClick={(event: React.MouseEvent) =>
									handleClose(event, tab.id)
								}
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
