import { type NextRequest, NextResponse } from "next/server";

function hasSupabaseAuthCookie(request: NextRequest) {
  const cookies = request.cookies.getAll();
  return cookies.some(({ name }) => {
    // Common Supabase SSR cookie naming patterns
    // e.g. sb-<project-ref>-auth-token, sb-access-token, sb-refresh-token
    if (!name.startsWith("sb")) return false;
    return (
      name.includes("auth-token") ||
      name.endsWith("access-token") ||
      name.endsWith("refresh-token") ||
      name === "sb-access-token" ||
      name === "sb-refresh-token"
    );
  });
}

function isStaticAssetPath(pathname: string) {
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Public routes allowed without authentication
  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/auth/callback") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/debug") ||
    pathname.startsWith("/i/");

  // Never block static assets or public routes.
  if (isPublicRoute || isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  // Avoid Edge network calls here; rely on the presence of Supabase auth cookies.
  if (!hasSupabaseAuthCookie(request)) {
    const loginUrl = new URL("/login", url.origin);
    const encoded = `${pathname}${url.search}`.replace(/^\/+/, "");
    if (encoded) loginUrl.searchParams.set("return_to", encoded);
    return NextResponse.redirect(loginUrl);
  }

  // Allow proceeding to invite acceptance pages even if no current team
  if (pathname.startsWith("/teams/invite/")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
