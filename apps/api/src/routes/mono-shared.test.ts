import { describe, expect, it } from "bun:test";

import {
	buildMonoRef,
	normalizeMonoDetailStatus,
	parseMonoRef,
	shouldTriggerInitialMonoSync,
} from "./mono-shared";

describe("buildMonoRef / parseMonoRef", () => {
	it("round-trips team and user identifiers", () => {
		const ref = buildMonoRef({
			teamId: "team_123",
			userId: "user_456",
		});

		expect(parseMonoRef(ref)).toEqual({
			teamId: "team_123",
			userId: "user_456",
		});
	});

	it("rejects malformed refs", () => {
		expect(parseMonoRef("bad-ref")).toBeNull();
	});
});

describe("normalizeMonoDetailStatus", () => {
	it("normalizes Mono data status strings", () => {
		expect(normalizeMonoDetailStatus("AVAILABLE")).toBe("available");
		expect(normalizeMonoDetailStatus(" partial ")).toBe("partial");
		expect(normalizeMonoDetailStatus("PROCESSING")).toBe("processing");
	});

	it("returns null for unknown statuses", () => {
		expect(normalizeMonoDetailStatus("SOMETHING_ELSE")).toBeNull();
	});
});

describe("shouldTriggerInitialMonoSync", () => {
	it("triggers when account data is available and never synced", () => {
		expect(
			shouldTriggerInitialMonoSync({
				detailStatus: "available",
				lastSyncedAt: null,
				retrievedData: ["transactions"],
			})
		).toBe(true);
	});

	it("does not trigger after the first successful sync", () => {
		expect(
			shouldTriggerInitialMonoSync({
				detailStatus: "available",
				lastSyncedAt: new Date().toISOString(),
				retrievedData: ["transactions"],
			})
		).toBe(false);
	});
});
