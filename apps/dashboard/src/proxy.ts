import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

import {
	isProtectedExternalPath,
	toExternalPath,
	toLocalePathname,
} from "@/lib/locale-routing";
import { defaultLocale, locales } from "@/locales/config";

const LOGIN_PATH = "/login";

const I18nMiddleware = createI18nMiddleware({
	defaultLocale,
	locales: [...locales],
	urlMappingStrategy: "rewrite",
});

const buildLoginRedirect = (request: NextRequest, externalPath: string) => {
	const loginUrl = new URL(LOGIN_PATH, request.url);

	if (externalPath !== LOGIN_PATH) {
		loginUrl.searchParams.set("return_to", externalPath);
	}

	return NextResponse.redirect(loginUrl);
};

export function proxy(request: NextRequest) {
	const i18nResponse = I18nMiddleware(request);
	const sessionCookie = getSessionCookie(request);
	const externalPathname = toExternalPath(request.nextUrl.pathname);
	const externalPath = toExternalPath(
		request.nextUrl.pathname,
		request.nextUrl.search
	);
	const isProtectedPath = isProtectedExternalPath(externalPathname);

	if (isProtectedPath && !sessionCookie) {
		return buildLoginRedirect(request, externalPath);
	}

	if (isProtectedPath && sessionCookie) {
		const requestHeaders = new Headers(request.headers);
		requestHeaders.set("x-faworra-pathname", externalPathname);
		requestHeaders.set("x-faworra-search", request.nextUrl.search);

		const rewrittenPath = i18nResponse.headers.get("x-middleware-rewrite");
		const response = rewrittenPath
			? NextResponse.rewrite(rewrittenPath, {
					request: { headers: requestHeaders },
				})
			: NextResponse.rewrite(
					new URL(toLocalePathname(externalPathname), request.url),
					{
						request: { headers: requestHeaders },
					}
				);

		const localeHeader = i18nResponse.headers.get("x-next-locale");
		if (localeHeader) {
			response.headers.set("x-next-locale", localeHeader);
		}

		const setCookie = i18nResponse.headers.get("set-cookie");
		if (setCookie) {
			response.headers.set("set-cookie", setCookie);
		}

		return response;
	}

	return i18nResponse;
}

export const config = {
	matcher: ["/((?!api|_next|.*\\..*|favicon.ico|manifest.webmanifest).*)"],
};
