import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { resolveShellRedirect } from "@/lib/protected-shell";
import { getServerViewer } from "@/lib/server-viewer";

/**
 * Midday-shaped protected app shell layout.
 *
 * This layout acts as the single centralised auth + workspace gate for all
 * routes in the (app) route group.  Individual pages inside this group do
 * not need their own auth checks — this layout enforces the invariant once
 * and redirects to the right recovery surface.
 *
 * Decision logic mirrors Midday's (app)/(sidebar)/layout.tsx adapted for
 * Better Auth instead of Supabase Auth.
 *
 * Route protection layers
 * 1. Next.js middleware (proxy.ts) — edge cookie check for guests: fast,
 *    O(1), no DB round-trip.  Redirects to /login with return_to preserved.
 * 2. This layout — server-side session validation: catches stale/invalid
 *    cookies that passed the edge check and builds return_to from the
 *    x-faworra-pathname request header set by the middleware.
 */
export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const viewer = await getServerViewer();

	// Read the current path that the middleware forwarded via request headers
	// so we can reconstruct a meaningful return_to for the stale-cookie case.
	const requestHeaders = await headers();
	const pathFromMiddleware =
		requestHeaders.get("x-faworra-pathname") ?? "/dashboard";
	const searchFromMiddleware = requestHeaders.get("x-faworra-search") ?? "";
	const currentPath = `${pathFromMiddleware}${searchFromMiddleware}`;

	const shellRedirect = resolveShellRedirect(viewer, currentPath);
	if (shellRedirect) {
		redirect(shellRedirect);
	}

	return <>{children}</>;
}
