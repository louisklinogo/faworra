import { describe, expect, it } from "bun:test";

import {
	isProtectedExternalPath,
	stripLocaleFromPathname,
	toExternalPath,
	toLocalePathname,
} from "./locale-routing";

describe("stripLocaleFromPathname", () => {
	it("removes the supported locale prefix", () => {
		expect(stripLocaleFromPathname("/en/dashboard")).toBe("/dashboard");
		expect(stripLocaleFromPathname("/en")).toBe("/");
	});

	it("leaves locale-free paths unchanged", () => {
		expect(stripLocaleFromPathname("/dashboard")).toBe("/dashboard");
		expect(stripLocaleFromPathname("/")).toBe("/");
	});
});

describe("toExternalPath", () => {
	it("preserves search params while stripping the locale prefix", () => {
		expect(toExternalPath("/en/dashboard", "?tab=billing")).toBe(
			"/dashboard?tab=billing"
		);
	});
});

describe("isProtectedExternalPath", () => {
	it("recognises protected clean URLs", () => {
		expect(isProtectedExternalPath("/dashboard")).toBe(true);
		expect(isProtectedExternalPath("/dashboard/settings")).toBe(true);
		expect(isProtectedExternalPath("/onboarding")).toBe(true);
		expect(isProtectedExternalPath("/teams")).toBe(true);
		expect(isProtectedExternalPath("/login")).toBe(false);
	});
});

describe("toLocalePathname", () => {
	it("maps clean URLs to the internal locale-organised route tree", () => {
		expect(toLocalePathname("/")).toBe("/en");
		expect(toLocalePathname("/dashboard")).toBe("/en/dashboard");
		expect(toLocalePathname("/en/teams")).toBe("/en/teams");
	});
});
