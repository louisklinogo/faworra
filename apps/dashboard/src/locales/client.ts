"use client";

import { createI18nClient } from "next-international/client";

export const {
	I18nProviderClient,
	useChangeLocale,
	useCurrentLocale,
	useI18n,
	useScopedI18n,
} = createI18nClient({
	en: () => import("./en"),
});
