import z from "zod";

export const DEFAULT_INDUSTRY_KEY = "fashion" as const;
export const DEFAULT_INDUSTRY_CONFIG_VERSION = "v1" as const;

export const onboardingInputSchema = z.object({
	companyName: z
		.string()
		.trim()
		.min(2, "Company name must be at least 2 characters")
		.max(120, "Company name must be 120 characters or fewer"),
	baseCurrency: z
		.string()
		.trim()
		.min(3, "Use a 3-letter currency code")
		.max(3, "Use a 3-letter currency code")
		.regex(/^[A-Za-z]{3}$/, "Use a valid 3-letter currency code"),
	countryCode: z
		.string()
		.trim()
		.min(2, "Use a 2-letter country code")
		.max(2, "Use a 2-letter country code")
		.regex(/^[A-Za-z]{2}$/, "Use a valid 2-letter country code"),
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

export const normalizeOnboardingInput = (input: OnboardingInput) => ({
	companyName: input.companyName.trim(),
	baseCurrency: input.baseCurrency.trim().toUpperCase(),
	countryCode: input.countryCode.trim().toUpperCase(),
});
