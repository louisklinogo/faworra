"use client";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@faworra-new/ui/components/select";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

function ThemeIcon({ currentTheme }: { currentTheme?: Theme }) {
	switch (currentTheme) {
		case "dark": {
			return <Moon size={12} />;
		}
		case "system": {
			return <Monitor size={12} />;
		}
		default: {
			return <Sun size={12} />;
		}
	}
}

export function ThemeSwitch() {
	const { resolvedTheme, setTheme, theme, themes } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return <div className="h-[24px]" />;
	}

	return (
		<div className="relative flex items-center">
			<Select
				onValueChange={(value: Theme) => {
					setTheme(value);
				}}
				value={theme}
			>
				<SelectTrigger className="h-[24px] w-full border-0 bg-transparent py-0.5 pr-3 pl-6 text-xs capitalize shadow-none outline-none">
					<SelectValue>
						{theme
							? theme.charAt(0).toUpperCase() + theme.slice(1)
							: "Select theme"}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{themes.map((themeName) => (
							<SelectItem
								className="text-xs capitalize"
								key={themeName}
								value={themeName}
							>
								{themeName}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>

			<div className="pointer-events-none absolute left-2">
				<ThemeIcon currentTheme={resolvedTheme as Theme} />
			</div>
		</div>
	);
}
