import { describe, expect, it } from "bun:test";

import { billingValidators } from "./billing-validators";

describe("billing env validators", () => {
	it("deferred billing mode does not require Polar boot values", () => {
		expect(
			billingValidators.POLAR_ACCESS_TOKEN.safeParse(undefined).success
		).toBe(true);
		expect(
			billingValidators.POLAR_PRO_PRODUCT_ID.safeParse(undefined).success
		).toBe(true);
		expect(
			billingValidators.POLAR_SUCCESS_URL.safeParse(undefined).success
		).toBe(true);
	});

	it("accepts valid Polar configuration when billing is enabled", () => {
		expect(
			billingValidators.POLAR_ACCESS_TOKEN.safeParse("pat_abc123").success
		).toBe(true);
		expect(
			billingValidators.POLAR_PRO_PRODUCT_ID.safeParse("prod_xyz").success
		).toBe(true);
		expect(
			billingValidators.POLAR_SUCCESS_URL.safeParse(
				"https://example.com/success"
			).success
		).toBe(true);
	});

	it("rejects empty string tokens even when billing would be enabled", () => {
		expect(billingValidators.POLAR_ACCESS_TOKEN.safeParse("").success).toBe(
			false
		);
		expect(billingValidators.POLAR_PRO_PRODUCT_ID.safeParse("").success).toBe(
			false
		);
	});
});
