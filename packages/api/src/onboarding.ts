import z from "zod";

import countryFlags from "./country-flags";
import { uniqueCurrencies } from "./currencies";

// Derive validation sets directly from Midday's location datasets so the
// server-side boundary matches exactly the selector surface presented to users.
const LOCATION_COUNTRY_CODES = new Set(
	Object.keys(countryFlags).map((k) => k.toUpperCase())
);
const LOCATION_CURRENCY_CODES = new Set(
	uniqueCurrencies.map((c) => c.toUpperCase())
);

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
		.min(1, "Please select a currency")
		.refine(
			(code) => LOCATION_CURRENCY_CODES.has(code.toUpperCase()),
			"Please select a valid currency from the list"
		),
	countryCode: z
		.string()
		.trim()
		.min(1, "Please select a country")
		.refine(
			(code) => LOCATION_COUNTRY_CODES.has(code.toUpperCase()),
			"Please select a valid country from the list"
		),
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

export const normalizeOnboardingInput = (input: OnboardingInput) => ({
	companyName: input.companyName.trim(),
	baseCurrency: input.baseCurrency.trim().toUpperCase(),
	countryCode: input.countryCode.trim().toUpperCase(),
});
