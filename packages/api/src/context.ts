import { auth } from "@faworra-new/auth";
import type { Context as HonoContext } from "hono";

import { getViewerState } from "./lib/team";

export interface CreateContextOptions {
	context: HonoContext;
}

export async function createContextFromHeaders(requestHeaders: Headers) {
	const session = await auth.api.getSession({
		headers: requestHeaders,
	});

	if (!session) {
		return {
			session: null,
			userId: null,
			activeTeam: null,
			membership: null,
			needsOnboarding: false,
		};
	}

	const viewerState = await getViewerState(session.user.id);

	return {
		session,
		userId: session.user.id,
		...viewerState,
	};
}

export function createContext({ context }: CreateContextOptions) {
	return createContextFromHeaders(context.req.raw.headers);
}

export type Context = Awaited<ReturnType<typeof createContext>>;
