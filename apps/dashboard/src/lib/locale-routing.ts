import { defaultLocale, locales } from "@/locales/config";

export const stripLocaleFromPathname = (pathname: string): string => {
	const segments = pathname.split("/");
	const maybeLocale = segments[1];

	if (
		maybeLocale &&
		locales.includes(maybeLocale as (typeof locales)[number])
	) {
		const strippedPath = pathname.slice(maybeLocale.length + 1);
		return strippedPath || "/";
	}

	return pathname || "/";
};

export const toExternalPath = (pathname: string, search = ""): string => {
	const externalPathname = stripLocaleFromPathname(pathname);
	return `${externalPathname}${search}`;
};

export const isProtectedExternalPath = (pathname: string): boolean => {
	return (
		pathname === "/onboarding" ||
		pathname === "/teams" ||
		pathname.startsWith("/dashboard")
	);
};

export const toLocalePathname = (pathname: string): string => {
	if (pathname === "/") {
		return `/${defaultLocale}`;
	}

	const externalPathname = stripLocaleFromPathname(pathname);
	return `/${defaultLocale}${externalPathname}`;
};
