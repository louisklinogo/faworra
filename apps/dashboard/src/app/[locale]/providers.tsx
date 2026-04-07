"use client";

import type { ReactNode } from "react";

import AppProviders from "@/components/providers";
import { I18nProviderClient } from "@/locales/client";

interface ProviderProps {
	children: ReactNode;
	locale: string;
}

export function Providers({ children, locale }: ProviderProps) {
	return (
		<AppProviders>
			<I18nProviderClient locale={locale}>{children}</I18nProviderClient>
		</AppProviders>
	);
}
