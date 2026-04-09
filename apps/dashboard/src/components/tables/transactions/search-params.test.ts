import { describe, expect, it } from "bun:test";

import {
	parseTransactionsSearchState,
	toTransactionsListInput,
} from "./search-params";

describe("parseTransactionsSearchState", () => {
	it("parses canonical route params into typed transaction filters", () => {
		const params = new URLSearchParams({
			accountId: "acc_1",
			categorySlug: "office-supplies",
			internal: "true",
			type: "expense",
			q: "paper",
			status: "posted",
			tab: "all",
		});

		expect(parseTransactionsSearchState(params)).toEqual({
			accountId: "acc_1",
			categorySlug: "office-supplies",
			dateFrom: "",
			dateTo: "",
			datePreset: "",
			internal: true,
			type: "expense",
			maxAmount: "",
			minAmount: "",
			q: "paper",
			status: "posted",
			tab: "all",
		});
	});

	it("defaults unknown values to the safe all-tab state", () => {
		expect(parseTransactionsSearchState(new URLSearchParams())).toEqual({
			accountId: "",
			categorySlug: "",
			dateFrom: "",
			dateTo: "",
			datePreset: "",
			internal: undefined,
			type: undefined,
			maxAmount: "",
			minAmount: "",
			q: "",
			status: undefined,
			tab: "all",
		});
	});
});

describe("toTransactionsListInput", () => {
	it("maps review tab state to the pending review queue", () => {
		expect(
			toTransactionsListInput({
				accountId: "",
				categorySlug: "",
				dateFrom: "",
				dateTo: "",
				datePreset: "",
				internal: undefined,
				type: undefined,
				maxAmount: "",
				minAmount: "",
				q: "",
				status: undefined,
				tab: "review",
			})
		).toMatchObject({
			limit: 100,
			statuses: ["pending"],
		});
	});

	it("maps all-tab state to direct list filters", () => {
		const result = toTransactionsListInput({
			accountId: "acc_1",
			categorySlug: "sales",
			dateFrom: "2026-04-01",
			dateTo: "2026-04-30",
			datePreset: "",
			internal: false,
			type: "income",
			maxAmount: "2500",
			minAmount: "100.25",
			q: "invoice",
			status: "posted",
			tab: "all",
		});

		expect(result).toMatchObject({
			bankAccountIds: ["acc_1"],
			categorySlugs: ["sales"],
			internal: false,
			type: "income",
			limit: 100,
			maxAmount: 250_000,
			minAmount: 10_025,
			q: "invoice",
			statuses: ["posted"],
		});

		expect(result.dateFrom?.toISOString()).toBe(
			new Date("2026-04-01T00:00:00.000Z").toISOString()
		);
		expect(result.dateTo?.toISOString()).toBe(
			new Date("2026-04-30T23:59:59.999Z").toISOString()
		);
	});

	it("drops malformed date and amount params instead of emitting invalid query values", () => {
		const result = toTransactionsListInput({
			accountId: "",
			categorySlug: "",
			dateFrom: "not-a-date",
			dateTo: "bad-date",
			datePreset: "",
			internal: undefined,
			type: undefined,
			maxAmount: "abc",
			minAmount: "still-bad",
			q: "",
			status: undefined,
			tab: "all",
		});

		expect(result.dateFrom).toBeUndefined();
		expect(result.dateTo).toBeUndefined();
		expect(result.maxAmount).toBeUndefined();
		expect(result.minAmount).toBeUndefined();
	});
});
