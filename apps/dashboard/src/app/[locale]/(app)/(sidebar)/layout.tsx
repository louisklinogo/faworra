"use client";

import { Header } from "@/components/header";
import { GlobalSheetsProvider } from "@/components/sheets/global-sheets-provider";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";
import { TabProvider } from "@/components/tab-context";

function SidebarLayoutContent({ children }: { children: React.ReactNode }) {
	const { isLocked } = useSidebar();

	return (
		<div className="relative min-h-screen bg-background transition-all duration-200">
			<Sidebar />

			<div
				className="transition-all duration-300 ease-in-out"
				style={{ marginLeft: isLocked ? 240 : 70 }}
			>
				<Header />
				<div className="px-4 pt-4 md:px-6">{children}</div>
				<GlobalSheetsProvider />
			</div>
		</div>
	);
}

export default function SidebarLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<TabProvider>
			<SidebarProvider>
				<SidebarLayoutContent>{children}</SidebarLayoutContent>
			</SidebarProvider>
		</TabProvider>
	);
}
