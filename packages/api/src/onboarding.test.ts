import { describe, expect, it } from "bun:test";

import {
	normalizeOnboardingInput,
	type OnboardingInput,
	onboardingInputSchema,
} from "./onboarding";

const RE_AT_LEAST_2 = /at least 2 characters/i;
const RE_120_CHARS = /120 characters/i;
const RE_SELECT_CURRENCY = /please select a (valid )?currency/i;
const RE_SELECT_COUNTRY = /please select a (valid )?country/i;

const VALID_INPUT: OnboardingInput = {
	companyName: "Maison Paco",
	baseCurrency: "EUR",
	countryCode: "FR",
};

describe("onboardingInputSchema", () => {
	describe("companyName", () => {
		it("accepts a valid company name", () => {
			expect(onboardingInputSchema.safeParse(VALID_INPUT).success).toBe(true);
		});

		it("rejects a name shorter than 2 characters", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				companyName: "A",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_AT_LEAST_2);
			}
		});

		it("rejects an empty company name", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				companyName: "",
			});
			expect(result.success).toBe(false);
		});

		it("rejects a company name longer than 120 characters", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				companyName: "A".repeat(121),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_120_CHARS);
			}
		});

		it("trims whitespace before validation", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				companyName: "  AB  ",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("baseCurrency", () => {
		it("accepts a valid currency code from the Midday selector dataset", () => {
			expect(
				onboardingInputSchema.safeParse({ ...VALID_INPUT, baseCurrency: "GHS" })
					.success
			).toBe(true);
		});

		it("accepts the Ghana cedi code (GHS)", () => {
			expect(
				onboardingInputSchema.safeParse({ ...VALID_INPUT, baseCurrency: "GHS" })
					.success
			).toBe(true);
		});

		it("accepts EUR and USD", () => {
			expect(
				onboardingInputSchema.safeParse({ ...VALID_INPUT, baseCurrency: "EUR" })
					.success
			).toBe(true);
			expect(
				onboardingInputSchema.safeParse({ ...VALID_INPUT, baseCurrency: "USD" })
					.success
			).toBe(true);
		});

		it("accepts AQD — Midday location dataset includes Antarctica currency", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "AQD",
			});
			expect(result.success).toBe(true);
		});

		it("accepts lowercase letters (schema normalizes before dataset check)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "eur",
			});
			expect(result.success).toBe(true);
		});

		it("accepts GHS in lowercase", () => {
			expect(
				onboardingInputSchema.safeParse({ ...VALID_INPUT, baseCurrency: "ghs" })
					.success
			).toBe(true);
		});

		it("rejects an empty currency code", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_SELECT_CURRENCY);
			}
		});

		it("rejects an arbitrary code not in the Midday dataset (ZZZ)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "ZZZ",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_SELECT_CURRENCY);
			}
		});

		it("rejects a code not found in the selector dataset (XYZ)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "XYZ",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("countryCode", () => {
		it("accepts a valid country code from the Midday selector dataset", () => {
			expect(
				onboardingInputSchema.safeParse({ ...VALID_INPUT, countryCode: "GH" })
					.success
			).toBe(true);
		});

		it("accepts the Ghana country code (GH)", () => {
			expect(
				onboardingInputSchema.safeParse({ ...VALID_INPUT, countryCode: "GH" })
					.success
			).toBe(true);
		});

		it("accepts EU — Midday location dataset includes European Union", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "EU",
			});
			expect(result.success).toBe(true);
		});

		it("accepts GH in lowercase", () => {
			expect(
				onboardingInputSchema.safeParse({ ...VALID_INPUT, countryCode: "gh" })
					.success
			).toBe(true);
		});

		it("rejects an empty country code", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_SELECT_COUNTRY);
			}
		});

		it("rejects an arbitrary code not in the Midday dataset (ZZ)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "ZZ",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_SELECT_COUNTRY);
			}
		});

		it("rejects a code not found in the selector dataset (XX)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "XX",
			});
			expect(result.success).toBe(false);
		});
	});
});

describe("normalizeOnboardingInput", () => {
	it("uppercases the currency code", () => {
		const result = normalizeOnboardingInput({
			companyName: "Maison Paco",
			baseCurrency: "eur",
			countryCode: "FR",
		});
		expect(result.baseCurrency).toBe("EUR");
	});

	it("uppercases the country code", () => {
		const result = normalizeOnboardingInput({
			companyName: "Maison Paco",
			baseCurrency: "EUR",
			countryCode: "fr",
		});
		expect(result.countryCode).toBe("FR");
	});

	it("trims whitespace from company name", () => {
		const result = normalizeOnboardingInput({
			companyName: "  Maison Paco  ",
			baseCurrency: "EUR",
			countryCode: "FR",
		});
		expect(result.companyName).toBe("Maison Paco");
	});

	it("normalizes all fields at once", () => {
		const result = normalizeOnboardingInput({
			companyName: "  Afi Threads  ",
			baseCurrency: "ghs",
			countryCode: "gh",
		});
		expect(result).toEqual({
			companyName: "Afi Threads",
			baseCurrency: "GHS",
			countryCode: "GH",
		});
	});

	it("preserves an already-normalized input unchanged", () => {
		const result = normalizeOnboardingInput(VALID_INPUT);
		expect(result).toEqual(VALID_INPUT);
	});
});
