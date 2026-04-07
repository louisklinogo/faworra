"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { usePathname } from "next/navigation";

export interface TabItem {
	iconName: string;
	id: string;
	label: string;
	path: string;
	isPinned?: boolean;
}

export const OVERVIEW_TAB: TabItem = {
	id: "overview",
	label: "Overview",
	path: "/dashboard",
	iconName: "Overview",
	isPinned: true,
};

interface TabContextValue {
	activeTabId: string | null;
	addTab: (tab: TabItem) => void;
	getTabByPath: (path: string) => TabItem | undefined;
	removeTab: (id: string) => void;
	setActiveTab: (id: string) => void;
	tabs: TabItem[];
}

const TabContext = createContext<TabContextValue | null>(null);

const STORAGE_KEY = "faworra-tabs";

export function TabProvider({ children }: { children: ReactNode }) {
	const [tabs, setTabs] = useState<TabItem[]>([OVERVIEW_TAB]);
	const [activeTabId, setActiveTabId] = useState<string | null>("overview");

	// Use a ref to track current tabs inside the pathname sync effect
	// WITHOUT adding `tabs` as a dependency (which would cause a re-add loop).
	const tabsRef = useRef(tabs);
	useEffect(() => {
		tabsRef.current = tabs;
	}, [tabs]);

	// Restore tabs from localStorage on mount, ensuring Overview is always pinned first.
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed: TabItem[] = JSON.parse(stored);
				if (Array.isArray(parsed) && parsed.length > 0) {
					// Always guarantee the pinned Overview tab is present and first
					const withoutOverview = parsed.filter((t) => t.id !== "overview");
					setTabs([OVERVIEW_TAB, ...withoutOverview]);
				}
			}
		} catch {
			// Ignore storage errors
		}
	}, []);

	// Persist tabs to localStorage whenever they change
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
		} catch {
			// Ignore storage errors
		}
	}, [tabs]);

	const addTab = useCallback((tab: TabItem) => {
		setTabs((current: TabItem[]) => {
			const existing = current.find((t: TabItem) => t.path === tab.path);
			if (existing) {
				setActiveTabId(existing.id);
				return current;
			}
			setActiveTabId(tab.id);
			return [...current, tab];
		});
	}, []);

	const pathname = usePathname();

	// Sync active URL with the workspace.
	// CRITICAL: we use tabsRef.current (not `tabs`) so this effect only re-runs
	// when the pathname changes, not when tabs change — preventing the re-add loop.
	useEffect(() => {
		if (!pathname) return;

		const currentTabs = tabsRef.current;
		const existing = currentTabs.find((t: TabItem) => t.path === pathname);

		if (existing) {
			// Tab already exists — just activate it
			setActiveTabId(existing.id);
		} else if (pathname === "/dashboard") {
			// Always resolve the Overview tab for the dashboard path
			setActiveTabId("overview");
		} else if (pathname.startsWith("/")) {
			// Auto-add a tab for known dashboard routes
			const label = pathname.split("/").filter(Boolean).at(-1) || "Page";
			addTab({
				id: pathname,
				path: pathname,
				label: label.charAt(0).toUpperCase() + label.slice(1),
				iconName: label.toLowerCase(),
			});
		}
	}, [pathname, addTab]);

	const removeTab = useCallback((id: string) => {
		// Never remove the pinned overview
		if (id === "overview") return;
		setTabs((current: TabItem[]) => {
			const newTabs = current.filter((t: TabItem) => t.id !== id);
			// If removing the currently active tab, fall back to the last available tab
			setActiveTabId((currentActive: string | null) => {
				if (currentActive === id) {
					return newTabs.at(-1)?.id ?? "overview";
				}
				return currentActive;
			});
			return newTabs;
		});
	}, []);

	const setActiveTab = useCallback((id: string) => {
		setActiveTabId(id);
	}, []);

	const getTabByPath = useCallback(
		(path: string) => {
			return tabs.find((t: TabItem) => t.path === path);
		},
		[tabs],
	);

	return (
		<TabContext.Provider
			value={{
				tabs,
				activeTabId,
				addTab,
				removeTab,
				setActiveTab,
				getTabByPath,
			}}
		>
			{children}
		</TabContext.Provider>
	);
}

export function useTabs() {
	const context = useContext(TabContext);
	if (!context) {
		throw new Error("useTabs must be used within TabProvider");
	}
	return context;
}
