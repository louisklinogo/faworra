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

export const protectedOwnerTeamProcedure = protectedTeamProcedure.use(
	({ ctx, next }) => {
		if (ctx.membership.role !== "owner") {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Owner permissions required",
			});
		}

		return next({
			ctx,
		});
	}
);

export const protectedAdminTeamProcedure = protectedTeamProcedure.use(
	({ ctx, next }) => {
		const role = ctx.membership.role;
		if (role !== "owner" && role !== "admin") {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Admin or Owner permissions required",
			});
		}

		return next({
			ctx,
		});
	}
);

export const protectedFinanceTeamProcedure = protectedTeamProcedure.use(
	({ ctx, next }) => {
		const role = ctx.membership.role;
		if (role !== "owner" && role !== "admin" && role !== "accountant") {
			throw new TRPCError({
				code: "FORBIDDEN",
				message:
					"Transaction write permissions require Owner, Admin, or Accountant",
			});
		}

		return next({
			ctx,
		});
	}
);
