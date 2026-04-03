import { describe, expect, it } from "bun:test";

import {
	getPolarCheckoutProducts,
	POLAR_PRO_PRODUCT_SLUG,
} from "./polar-products";

describe("getPolarCheckoutProducts", () => {
	it("returns the configured pro checkout mapping", () => {
		expect(getPolarCheckoutProducts("prod_123")).toEqual([
			{
				productId: "prod_123",
				slug: POLAR_PRO_PRODUCT_SLUG,
			},
		]);
	});

	it("trims surrounding whitespace from the configured product id", () => {
		expect(getPolarCheckoutProducts("  prod_123  ")).toEqual([
			{
				productId: "prod_123",
				slug: POLAR_PRO_PRODUCT_SLUG,
			},
		]);
	});

	it("rejects the placeholder product id", () => {
		expect(() => getPolarCheckoutProducts("your-product-id")).toThrow(
			"Set POLAR_PRO_PRODUCT_ID to a real Polar product id before enabling checkout"
		);
	});
});
