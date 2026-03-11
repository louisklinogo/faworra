import { protectedProcedure, router } from "../index";
import { completeOnboarding } from "../lib/team";
import { normalizeOnboardingInput, onboardingInputSchema } from "../onboarding";

export const onboardingRouter = router({
	complete: protectedProcedure
		.input(onboardingInputSchema)
		.mutation(({ ctx, input }) => {
			return completeOnboarding(ctx.userId, normalizeOnboardingInput(input));
		}),
});
