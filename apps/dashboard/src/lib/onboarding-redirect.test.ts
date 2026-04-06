import { describe, expect, it } from "bun:test";

import { resolveOnboardingEntry } from "./onboarding-redirect";

describe("resolveOnboardingEntry", () => {
	describe("authenticated user with pending invites", () => {
		it("redirects to /teams when the user has pending invites", () => {
			expect(resolveOnboardingEntry(true)).toBe("/teams");
		});
	});

	describe("authenticated user with no pending invites", () => {
		it("returns null when the user has no pending invites (onboarding proceeds)", () => {
			expect(resolveOnboardingEntry(false)).toBeNull();
		});
	});
});
