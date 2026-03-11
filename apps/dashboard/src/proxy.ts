import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LOGIN_PATH = "/login";

const buildLoginRedirect = (request: NextRequest) => {
	const loginUrl = new URL(LOGIN_PATH, request.url);
	const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;

	if (returnTo !== LOGIN_PATH) {
		loginUrl.searchParams.set("return_to", returnTo);
	}

	return NextResponse.redirect(loginUrl);
};

export function proxy(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);
	const { pathname } = request.nextUrl;
	const isProtectedPath =
		pathname === "/onboarding" || pathname.startsWith("/dashboard");

	if (isProtectedPath && !sessionCookie) {
		return buildLoginRedirect(request);
	}

	if (pathname === LOGIN_PATH && sessionCookie) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/onboarding", "/login"],
};
