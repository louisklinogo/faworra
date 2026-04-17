import { describe, expect, it } from "bun:test";

import {
	transformMonoAccount,
	transformMonoBalance,
} from "./transform";

describe("transformMonoAccount", () => {
	it("maps Mono account details payloads to normalized accounts", () => {
		const result = transformMonoAccount({
			id: "mono_fallback",
			data: {
				account: {
					id: "acct_123",
					name: "Primary Business Account",
					account_number: "0131883461",
					currency: "GHS",
					type: "Digital Savings Account",
					balance: 333064,
					institution: {
						name: "GTBank",
						bank_code: "058",
						type: "PERSONAL_BANKING",
					},
				},
			},
			status: "successful",
		});

		expect(result).toEqual({
			accountNumber: "0131883461",
			availableBalance: 333064,
			balance: 333064,
			currency: "GHS",
			id: "acct_123",
			institutionId: "058",
			name: "Primary Business Account",
			provider: "mono",
			type: "savings",
		});
	});
});

describe("transformMonoBalance", () => {
	it("extracts balance from Mono account details payloads", () => {
		const result = transformMonoBalance({
			id: "mono_fallback",
			data: {
				account: {
					_id: "acct_456",
					name: "Primary Business Account",
					currency: "NGN",
					type: "Current Account",
					balance: 98765,
				},
			},
			status: "successful",
		});

		expect(result).toEqual({
			accountId: "acct_456",
			available: 98765,
			current: 98765,
			currency: "NGN",
		});
	});
});
