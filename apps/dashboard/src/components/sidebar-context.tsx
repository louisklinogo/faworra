"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextValue {
	isLocked: boolean;
	toggleLock: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "faworra-sidebar-locked";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [isLocked, setIsLocked] = useState(false);

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "true") {
			setIsLocked(true);
		}
	}, []);

	const toggleLock = () => {
		const next = !isLocked;
		setIsLocked(next);
		localStorage.setItem(STORAGE_KEY, String(next));
	};

	return (
		<SidebarContext.Provider value={{ isLocked, toggleLock }}>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within SidebarProvider");
	}
	return context;
}
