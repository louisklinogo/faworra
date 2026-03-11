import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!(ctx.session && ctx.userId)) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
			userId: ctx.userId,
		},
	});
});

export const protectedTeamProcedure = protectedProcedure.use(
	({ ctx, next }) => {
		if (!(ctx.activeTeam && ctx.membership)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Complete onboarding before accessing this resource",
			});
		}

		return next({
			ctx: {
				...ctx,
				activeTeam: ctx.activeTeam,
				membership: ctx.membership,
			},
		});
	}
);
