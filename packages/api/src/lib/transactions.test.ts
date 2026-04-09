import { describe, expect, it } from "bun:test";

import { isValidTransactionReviewTransition } from "./transactions";

describe("isValidTransactionReviewTransition", () => {
	it("allows pending transactions to be posted", () => {
		expect(
			isValidTransactionReviewTransition({
				from: "pending",
				to: "posted",
			})
		).toBe(true);
	});

	it("allows pending transactions to be excluded", () => {
		expect(
			isValidTransactionReviewTransition({
				from: "pending",
				to: "excluded",
			})
		).toBe(true);
	});

	it("allows excluded transactions to be posted", () => {
		expect(
			isValidTransactionReviewTransition({
				from: "excluded",
				to: "posted",
			})
		).toBe(true);
	});

	it("rejects review transitions outside the current phase contract", () => {
		expect(
			isValidTransactionReviewTransition({
				from: "posted",
				to: "excluded",
			})
		).toBe(false);
		expect(
			isValidTransactionReviewTransition({
				from: "posted",
				to: "posted",
			})
		).toBe(false);
		expect(
			isValidTransactionReviewTransition({
				from: "excluded",
				to: "excluded",
			})
		).toBe(false);
	});
});
