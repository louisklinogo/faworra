import { createContextFromHeaders } from "@faworra-new/api/context";
import { MonoProvider } from "@faworra-new/banking/providers/mono";
import { env } from "@faworra-new/env/server";
import { Hono } from "hono";
import { z } from "zod";

import { buildMonoRef } from "./mono-shared";

const monoConnect = new Hono();

const initiateMonoLinkSchema = z.object({
	redirectUrl: z.url().optional(),
});

monoConnect.post("/initiate", async (c) => {
	const context = await createContextFromHeaders(c.req.raw.headers);

	if (!context.session || !context.userId) {
		return c.json({ error: "Authentication required" }, 401);
	}

	if (!context.activeTeam) {
		return c.json({ error: "Complete onboarding before linking a bank" }, 403);
	}

	const payload = initiateMonoLinkSchema.safeParse(
		await c.req.json().catch(() => ({}))
	);

	if (!payload.success) {
		return c.json(
			{
				error: "Invalid request payload",
				details: payload.error.flatten(),
			},
			400
		);
	}

	const customerEmail = context.session.user.email?.trim();
	if (!customerEmail) {
		return c.json({ error: "A verified email is required for Mono linking" }, 400);
	}

	const customerName =
		context.session.user.name?.trim() || context.activeTeam.name;
	const ref = buildMonoRef({
		teamId: context.activeTeam.id,
		userId: context.userId,
	});

	const provider = new MonoProvider();
	const { monoUrl } = await provider.initiateLinking({
		customer: {
			email: customerEmail,
			name: customerName,
		},
		meta: {
			ref,
			teamId: context.activeTeam.id,
			userId: context.userId,
		},
		redirectUrl: payload.data.redirectUrl ?? `${env.CORS_ORIGIN}/`,
	});

	return c.json({
		monoUrl,
		ref,
		teamId: context.activeTeam.id,
	});
});

export default monoConnect;
