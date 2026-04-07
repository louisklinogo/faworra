import { describe, expect, it } from "bun:test";

import { resolveUserPreferences } from "./user";

const requestLocation = {
	country: "GH",
	locale: "en-GH",
	timezone: "Africa/Accra",
};

describe("resolveUserPreferences", () => {
	it("falls back to request-derived defaults when nothing is stored", () => {
		expect(resolveUserPreferences(null, requestLocation)).toEqual({
			dateFormat: "yyyy-MM-dd",
			locale: "en-GH",
			timeFormat: 24,
			timezone: "Africa/Accra",
			timezoneAutoSync: true,
			weekStartsOnMonday: true,
		});
	});

	it("prefers stored values over request-derived defaults", () => {
		expect(
			resolveUserPreferences(
				{
					dateFormat: "dd/MM/yyyy",
					locale: "en-NG",
					timeFormat: 12,
					timezone: "Africa/Lagos",
					timezoneAutoSync: false,
					weekStartsOnMonday: false,
				},
				requestLocation
			)
		).toEqual({
			dateFormat: "dd/MM/yyyy",
			locale: "en-NG",
			timeFormat: 12,
			timezone: "Africa/Lagos",
			timezoneAutoSync: false,
			weekStartsOnMonday: false,
		});
	});
});
