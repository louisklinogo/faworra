import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { resolveShellRedirect } from "@/lib/protected-shell";
import { getServerViewer } from "@/lib/server-viewer";

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const viewer = await getServerViewer();

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
