import { getBankAccounts } from "@faworra-new/db/queries/bank-accounts";

import { protectedTeamProcedure, router } from "../index";

export const bankAccountsRouter = router({
	list: protectedTeamProcedure.query(({ ctx }) => {
		return getBankAccounts(ctx.db, { teamId: ctx.activeTeam.id });
	}),
});
