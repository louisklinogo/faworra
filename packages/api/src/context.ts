import { auth } from "@faworra-new/auth";
import { getLocationHeaders } from "@faworra-new/location";
import type { Context as HonoContext } from "hono";

import { getViewerState } from "./lib/team";

export interface CreateContextOptions {
	context: HonoContext;
}

export async function createContextFromHeaders(requestHeaders: Headers) {
	const derivedLocation = getLocationHeaders(requestHeaders);
	const requestLocation = {
		country: requestHeaders.get("x-user-country") ?? derivedLocation.country,
		locale: requestHeaders.get("x-user-locale") ?? derivedLocation.locale,
		timezone: requestHeaders.get("x-user-timezone") ?? derivedLocation.timezone,
	};

	const session = await auth.api.getSession({
		headers: requestHeaders,
	});

	if (!session) {
		return {
			requestLocation,
			session: null,
			userId: null,
			activeTeam: null,
			membership: null,
			needsOnboarding: false,
		};
	}

	const viewerState = await getViewerState(session.user.id);

	return {
		requestLocation,
		session,
		userId: session.user.id,
		...viewerState,
	};
}

export function createContext({ context }: CreateContextOptions) {
	return createContextFromHeaders(context.req.raw.headers);
}

export type Context = Awaited<ReturnType<typeof createContext>>;
