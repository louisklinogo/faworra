import { describe, expect, it } from "bun:test";

import {
	normalizeOnboardingInput,
	type OnboardingInput,
	onboardingInputSchema,
} from "./onboarding";

const RE_AT_LEAST_2 = /at least 2 characters/i;
const RE_120_CHARS = /120 characters/i;
const RE_3_LETTER = /3-letter/i;
const RE_VALID_3_LETTER = /valid 3-letter/i;
const RE_2_LETTER = /2-letter/i;
const RE_VALID_2_LETTER = /valid 2-letter/i;
const RE_ISO_4217 = /iso 4217/i;
const RE_ISO_3166 = /iso 3166/i;

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
		it("accepts a valid 3-letter currency code", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "GHS",
			});
			expect(result.success).toBe(true);
		});

		it("rejects a code shorter than 3 letters", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "GH",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_3_LETTER);
			}
		});

		it("rejects a code longer than 3 letters", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "GHSS",
			});
			expect(result.success).toBe(false);
		});

		it("rejects non-alphabetic currency codes", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "G12",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_VALID_3_LETTER);
			}
		});

		it("accepts lowercase letters (schema normalizes them)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "eur",
			});
			// The schema uses trim + min/max + regex which accepts lowercase
			// normalizeOnboardingInput uppercases it afterward
			expect(result.success).toBe(true);
		});

		it("rejects an empty currency code", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "",
			});
			expect(result.success).toBe(false);
		});

		it("rejects a semantically invalid code that passes shape checks (ZZZ)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "ZZZ",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_ISO_4217);
			}
		});

		it("accepts the canonical Ghana cedi code (GHS)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "GHS",
			});
			expect(result.success).toBe(true);
		});

		it("accepts GHS in lowercase (schema normalizes before canonical check)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				baseCurrency: "ghs",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("countryCode", () => {
		it("accepts a valid 2-letter country code", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "GH",
			});
			expect(result.success).toBe(true);
		});

		it("rejects a code shorter than 2 letters", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "G",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_2_LETTER);
			}
		});

		it("rejects a code longer than 2 letters", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "GHA",
			});
			expect(result.success).toBe(false);
		});

		it("rejects non-alphabetic country codes", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "G1",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_VALID_2_LETTER);
			}
		});

		it("rejects an empty country code", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "",
			});
			expect(result.success).toBe(false);
		});

		it("rejects a semantically invalid code that passes shape checks (ZZ)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "ZZ",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(RE_ISO_3166);
			}
		});

		it("accepts the canonical Ghana country code (GH)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "GH",
			});
			expect(result.success).toBe(true);
		});

		it("accepts GH in lowercase (schema normalizes before canonical check)", () => {
			const result = onboardingInputSchema.safeParse({
				...VALID_INPUT,
				countryCode: "gh",
			});
			expect(result.success).toBe(true);
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
