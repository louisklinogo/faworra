"use client";

import { Icons } from "@faworra-new/ui/components/icons";
import { cn } from "@faworra-new/ui/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useRef, useState } from "react";
import { type TabItem, useTabs } from "./tab-context";

const icons: Record<string, () => React.ReactNode> = {
	"/dashboard": () => <Icons.Overview size={20} />,
	"/reports": () => <Icons.Monitoring size={20} />,
	"/transactions": () => <Icons.Transactions size={20} />,
	"/transactions/categories": () => <Icons.Tag size={20} />,
	"/inbox": () => <Icons.Inbox2 size={20} />,
	"/invoices": () => <Icons.Invoice size={20} />,
	"/tracker": () => <Icons.Tracker size={20} />,
	"/customers": () => <Icons.Customers size={20} />,
	"/vault": () => <Icons.Vault size={20} />,
	"/apps": () => <Icons.Apps size={20} />,
	"/settings": () => <Icons.Settings size={20} />,
};

const menuItems: {
	path: string;
	name: string;
	children?: { path: string; name: string }[];
}[] = [
	{
		path: "/dashboard",
		name: "Overview",
	},
	{
		path: "/reports",
		name: "Reports",
	},
	{
		path: "/transactions",
		name: "Transactions",
		children: [
			{ path: "/transactions", name: "All Transactions" },
			{ path: "/transactions/categories", name: "Categories" },
		],
	},
	{
		path: "/inbox",
		name: "Inbox",
	},
	{
		path: "/invoices",
		name: "Invoices",
	},
	{
		path: "/tracker",
		name: "Tracker",
	},
	{
		path: "/customers",
		name: "Customers",
	},
	{
		path: "/vault",
		name: "Vault",
	},
	{
		path: "/apps",
		name: "Apps",
	},
	{
		path: "/settings",
		name: "Settings",
	},
];

interface ItemProps {
	isExpanded: boolean;
	isItemExpanded: boolean;
	item: {
		path: string;
		name: string;
		children?: { path: string; name: string }[];
	};
	onToggle: (path: string) => void;
}

const Item = ({ item, isExpanded, isItemExpanded, onToggle }: ItemProps) => {
	const Icon = icons[item.path] ?? (() => <Icons.Settings size={20} />);
	const hasChildren = item.children && item.children.length > 0;
	const shouldShowChildren = isExpanded && isItemExpanded;
	const { addTab } = useTabs();
	const pathname = usePathname();
	const router = useRouter();

	const handleClick = () => {
		if (hasChildren) {
			onToggle(item.path);
		} else {
			const tab: TabItem = {
				id: item.path,
				path: item.path,
				label: item.name,
				iconName: item.path.replace("/", ""),
			};
			addTab(tab);
			router.push(item.path as never);
		}
	};

	const isActive = pathname === item.path || (hasChildren && pathname.startsWith(item.path));

	return (
		<div className="w-full">
			<div className="group w-full text-left" onClick={handleClick}>
				<div className="relative">
					{/* Midday-style background and border */}
					<div
						className={cn(
							"mr-[15px] ml-[15px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
							"h-[40px] border border-transparent",
							isActive &&
								"border-[#e6e6e6] bg-[#f7f7f7] dark:border-[#1d1d1d] dark:bg-[#131313]",
							isExpanded ? "w-[calc(100%-30px)]" : "w-[40px]",
						)}
					/>

					{/* Icon container - always fixed distance from sidebar edge */}
					<div
						className={cn(
							"absolute top-0 left-[15px] flex h-[40px] w-[40px] items-center justify-center transition-colors duration-200",
							isActive
								? "text-primary dark:text-white"
								: "text-[#707070] group-hover:text-primary dark:text-[#666666] dark:group-hover:text-white",
						)}
					>
						<Icon />
					</div>

					{isExpanded && (
						<div className="pointer-events-none absolute top-0 right-[4px] left-[55px] flex h-[40px] items-center">
							<span
								className={cn(
									"font-medium text-sm transition-all duration-200 ease-in-out",
									"overflow-hidden whitespace-nowrap pr-2",
									isActive
										? "text-primary dark:text-white"
										: "text-[#707070] group-hover:text-primary dark:text-[#666666] dark:group-hover:text-white",
								)}
							>
								{item.name}
							</span>
							{hasChildren && (
								<button
									className={cn(
										"mr-3 ml-auto flex h-8 w-8 items-center justify-center transition-all duration-200",
										"pointer-events-auto text-[#888] hover:text-primary",
										isActive && "text-primary/60 dark:text-white/60",
										shouldShowChildren && "rotate-180",
									)}
									onClick={(e) => {
										e.stopPropagation();
										onToggle(item.path);
									}}
									type="button"
								>
									<Icons.ChevronDown size={14} />
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Render children when expanded */}
			{shouldShowChildren && hasChildren && item.children && (
				<div className="ml-[30px] mr-[15px]">
					{item.children.map((child) => {
						const childIcon = icons[child.path] ?? (() => <Icons.Settings size={20} />);
						const childIsActive = pathname === child.path;
						return (
							<div
								key={child.path}
								className="group w-full text-left"
								onClick={() => {
									const tab: TabItem = {
										id: child.path,
										path: child.path,
										label: child.name,
										iconName: child.path.replace("/", ""),
									};
									addTab(tab);
									router.push(child.path as never);
								}}
							>
								<div className="relative">
									<div
										className={cn(
											"transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
											"h-[36px] border border-transparent",
											childIsActive &&
												"border-[#e6e6e6] bg-[#f7f7f7] dark:border-[#1d1d1d] dark:bg-[#131313]",
											"w-full",
										)}
									/>
									<div className="absolute top-0 left-0 flex h-[36px] w-full items-center px-3">
										<span
											className={cn(
												"font-medium text-xs transition-colors duration-200",
												childIsActive
													? "text-primary dark:text-white"
													: "text-[#707070] group-hover:text-primary dark:text-[#666666] dark:group-hover:text-white",
											)}
										>
											{child.name}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

interface Props {
	isExpanded?: boolean;
}

export function MainMenu({ isExpanded = false }: Props) {
	const [expandedItem, setExpandedItem] = useState<string | null>(null);
	const prevExpanded = useRef(isExpanded);

	if (prevExpanded.current !== isExpanded) {
		prevExpanded.current = isExpanded;
		setExpandedItem(null);
	}

	return (
		<div className="mt-2 w-full">
			<nav className="w-full">
				<div className="flex flex-col gap-0">
					{menuItems.map((item) => {
						return (
							<Item
								isExpanded={isExpanded}
								isItemExpanded={expandedItem === item.path}
								item={item}
								key={item.path}
								onToggle={(path) => {
									setExpandedItem(expandedItem === path ? null : path);
								}}
							/>
						);
					})}
				</div>
			</nav>
		</div>
	);
}
