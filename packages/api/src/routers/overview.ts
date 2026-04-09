import { getOverviewSummary } from "@faworra-new/db/queries/overview";

import { protectedTeamProcedure, router } from "../index";

export const overviewRouter = router({
	summary: protectedTeamProcedure.query(({ ctx }) => {
		return getOverviewSummary(ctx.db, { teamId: ctx.activeTeam.id });
	}),
});
