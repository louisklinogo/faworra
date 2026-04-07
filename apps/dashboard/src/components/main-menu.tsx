"use client";

import { Icons } from "@faworra-new/ui/components/icons";
import { cn } from "@faworra-new/ui/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { type TabItem, useTabs } from "./tab-context";

const icons: Record<string, () => React.ReactNode> = {
	"/dashboard": () => <Icons.Overview size={20} />,
	"/reports": () => <Icons.Monitoring size={20} />,
	"/transactions": () => <Icons.Transactions size={20} />,
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
		const tab: TabItem = {
			id: item.path,
			path: item.path,
			label: item.name,
			iconName: item.path.replace("/", ""),
		};
		addTab(tab);
		router.push(item.path);
	};

	const isActive = pathname.includes(item.path);

	return (
		<button
			className="group w-full text-left"
			onClick={handleClick}
			type="button"
		>
			<div className="relative">
				{/* Midday-style background and border */}
				<div
					className={cn(
						"transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ml-[15px] mr-[15px]",
						"h-[40px] border border-transparent",
						isActive && "bg-[#f7f7f7] dark:bg-[#131313] border-[#e6e6e6] dark:border-[#1d1d1d]",
						isExpanded ? "w-[calc(100%-30px)]" : "w-[40px]"
					)}
				/>

				{/* Icon container - always fixed distance from sidebar edge */}
				<div className={cn(
					"absolute top-0 left-[15px] w-[40px] h-[40px] flex items-center justify-center transition-colors duration-200",
					isActive ? "text-primary dark:text-white" : "text-[#707070] group-hover:text-primary dark:text-[#666666] dark:group-hover:text-white"
				)}>
					<Icon />
				</div>

				{isExpanded && (
					<div className="absolute top-0 left-[55px] right-[4px] h-[40px] flex items-center pointer-events-none">
						<span
							className={cn(
								"text-sm font-medium transition-all duration-200 ease-in-out",
								"whitespace-nowrap overflow-hidden pr-2",
								isActive ? "text-primary dark:text-white" : "text-[#707070] group-hover:text-primary dark:text-[#666666] dark:group-hover:text-white"
							)}
						>
							{item.name}
						</span>
						{hasChildren && (
							<button
								className={cn(
									"w-8 h-8 flex items-center justify-center transition-all duration-200 ml-auto mr-3",
									"text-[#888] hover:text-primary pointer-events-auto",
									isActive && "text-primary/60 dark:text-white/60",
									shouldShowChildren && "rotate-180"
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
		</button>
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
