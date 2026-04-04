import { protectedTeamProcedure, publicProcedure, router } from "../index";

import { onboardingRouter } from "./onboarding";
import { teamRouter } from "./team";
import { teamInvitesRouter } from "./team-invites";
import { userRouter } from "./user";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	viewer: publicProcedure.query(({ ctx }) => {
		return {
			isAuthenticated: Boolean(ctx.session),
			user: ctx.session?.user ?? null,
			activeTeam: ctx.activeTeam,
			membership: ctx.membership,
			needsOnboarding: ctx.session ? ctx.needsOnboarding : false,
		};
	}),
	user: userRouter,
	team: teamRouter,
	onboarding: onboardingRouter,
	teamInvites: teamInvitesRouter,
	privateData: protectedTeamProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
			activeTeam: ctx.activeTeam,
			membership: ctx.membership,
		};
	}),
});
export type AppRouter = typeof appRouter;
