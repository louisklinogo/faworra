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

	it("allows paths with encoded query string characters", () => {
		// %3F = ?, %3D = =  — decoded result is a valid in-app path
		expect(getSafeReturnTo("/dashboard%3Ftab%3Dsettings")).toBe(
			"/dashboard?tab=settings"
		);
	});

	it("rejects non-path and protocol-relative destinations", () => {
		expect(getSafeReturnTo("dashboard")).toBe(DEFAULT_RETURN_TO);
		expect(getSafeReturnTo("https://evil.example")).toBe(DEFAULT_RETURN_TO);
		expect(getSafeReturnTo("//evil.example/path")).toBe(DEFAULT_RETURN_TO);
	});

	it("rejects slash-backslash destinations (open-redirect via browser normalisation)", () => {
		// Some browsers normalise /\ to // (protocol-relative), making this an
		// open-redirect vector.  Both the raw and JS-escaped forms must be blocked.
		expect(getSafeReturnTo("/\\evil.example")).toBe(DEFAULT_RETURN_TO);
		expect(getSafeReturnTo("/\\/evil.example")).toBe(DEFAULT_RETURN_TO);
	});

	it("rejects percent-encoded backslash variants (/%5C, /%5c)", () => {
		// /%5C and /%5c are the percent-encoded forms of backslash.  After
		// decoding they produce /\ which is an open-redirect vector in some
		// browsers.
		expect(getSafeReturnTo("/%5Cevil.example")).toBe(DEFAULT_RETURN_TO);
		expect(getSafeReturnTo("/%5cevil.example")).toBe(DEFAULT_RETURN_TO);
	});

	it("rejects percent-encoded double-slash variants (/%2F)", () => {
		// /%2F decodes to /, producing the // protocol-relative prefix when
		// combined with the leading slash.
		expect(getSafeReturnTo("/%2Fevil.example")).toBe(DEFAULT_RETURN_TO);
		expect(getSafeReturnTo("/%2fevil.example")).toBe(DEFAULT_RETURN_TO);
	});

	it("rejects mixed slash-backslash encoded variants", () => {
		// /\%2Fevil.example — second char is backslash after decoding
		expect(getSafeReturnTo("/\\%2Fevil.example")).toBe(DEFAULT_RETURN_TO);
		// /%5C%2Fevil.example — decodes to /\/ which starts with /\
		expect(getSafeReturnTo("/%5C%2Fevil.example")).toBe(DEFAULT_RETURN_TO);
	});

	it("falls back to the dashboard on malformed percent-encoding", () => {
		expect(getSafeReturnTo("/%GGbroken")).toBe(DEFAULT_RETURN_TO);
	});
});
