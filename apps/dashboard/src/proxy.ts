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
		pathname === "/onboarding" ||
		pathname === "/teams" ||
		pathname.startsWith("/dashboard");

	// Guests on protected paths → redirect to login with return_to preserved.
	if (isProtectedPath && !sessionCookie) {
		return buildLoginRedirect(request);
	}

	// Authenticated-looking users on protected paths → allow through.
	// Forward the current path as request headers so the server-side protected
	// shell layout can reconstruct return_to if the session turns out to be
	// stale (edge cookie presence does not guarantee a valid session).
	if (isProtectedPath && sessionCookie) {
		const requestHeaders = new Headers(request.headers);
		requestHeaders.set("x-faworra-pathname", pathname);
		requestHeaders.set("x-faworra-search", request.nextUrl.search);
		return NextResponse.next({ request: { headers: requestHeaders } });
	}

	// NOTE: We intentionally do NOT redirect authenticated-looking users away
	// from /login at the edge.  Edge cookie presence alone does not guarantee
	// a valid session.  Redirecting here would create a stale-cookie loop:
	//
	//   stale cookie + /dashboard → edge allows through
	//   → page detects invalid session → redirect to /login
	//   → edge sees cookie → redirect back to /dashboard → loop
	//
	// Instead, login/page.tsx validates the session server-side and redirects
	// authenticated users to the appropriate destination (safe return_to or
	// /onboarding).

	return NextResponse.next();
}

/**
 * Routes matched by this proxy.  Must be kept in sync with the protected
 * paths checked inside the `proxy` function above.
 */
export const config = {
	matcher: ["/dashboard/:path*", "/onboarding", "/teams", "/login"],
};
