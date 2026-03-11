import { describe, expect, it } from "bun:test";

import { DEFAULT_RETURN_TO, getSafeReturnTo } from "./return-to";

describe("getSafeReturnTo", () => {
	it("falls back to the dashboard when returnTo is missing", () => {
		expect(getSafeReturnTo()).toBe(DEFAULT_RETURN_TO);
		expect(getSafeReturnTo("")).toBe(DEFAULT_RETURN_TO);
	});

	it("allows same-site absolute paths", () => {
		expect(getSafeReturnTo("/dashboard")).toBe("/dashboard");
		expect(getSafeReturnTo("/dashboard?tab=billing")).toBe(
			"/dashboard?tab=billing"
		);
		expect(getSafeReturnTo("/onboarding")).toBe("/onboarding");
	});

	it("rejects non-path and protocol-relative destinations", () => {
		expect(getSafeReturnTo("dashboard")).toBe(DEFAULT_RETURN_TO);
		expect(getSafeReturnTo("https://evil.example")).toBe(DEFAULT_RETURN_TO);
		expect(getSafeReturnTo("//evil.example/path")).toBe(DEFAULT_RETURN_TO);
	});
});
