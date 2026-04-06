import { describe, expect, it } from "bun:test";

import {
	applyWorkspacePatchToPrivateData,
	applyWorkspacePatchToViewer,
	type WorkspacePatch,
} from "./workspace-cache";

const mockPatch: WorkspacePatch = {
	activeTeam: {
		id: "team-2",
		name: "New Team",
		logoUrl: null,
		settings: {
			baseCurrency: "USD",
			countryCode: "US",
			fiscalYearStartMonth: 1,
			industryKey: "tech",
			industryConfigVersion: "1",
		},
	},
	membership: { role: "owner", teamId: "team-2" },
	needsOnboarding: false,
};

const nullPatch: WorkspacePatch = {
	activeTeam: null,
	membership: null,
	needsOnboarding: true,
};

describe("applyWorkspacePatchToViewer", () => {
	describe("undefined old cache", () => {
		it("returns undefined when existing cache is undefined", () => {
			expect(applyWorkspacePatchToViewer(undefined, mockPatch)).toBeUndefined();
		});
	});

	describe("non-workspace fields preserved", () => {
		it("preserves isAuthenticated and user from existing cache", () => {
			const old = {
				isAuthenticated: true,
				user: { id: "u1", name: "User" },
				activeTeam: {
					id: "team-1",
					name: "Old Team",
					logoUrl: null,
					settings: null,
				},
				membership: { role: "member", teamId: "team-1" },
				needsOnboarding: false,
			};
			const result = applyWorkspacePatchToViewer(old, mockPatch);
			expect(result?.isAuthenticated).toBe(true);
			expect(result?.user).toEqual({ id: "u1", name: "User" });
		});
	});

	describe("workspace fields overwritten", () => {
		it("overwrites activeTeam, membership, and needsOnboarding with patch values", () => {
			const old = {
				isAuthenticated: true,
				user: null,
				activeTeam: {
					id: "team-1",
					name: "Old Team",
					logoUrl: null,
					settings: null,
				},
				membership: { role: "member", teamId: "team-1" },
				needsOnboarding: false,
			};
			const result = applyWorkspacePatchToViewer(old, mockPatch);
			expect(result?.activeTeam?.id).toBe("team-2");
			expect(result?.activeTeam?.name).toBe("New Team");
			expect(result?.membership?.teamId).toBe("team-2");
			expect(result?.membership?.role).toBe("owner");
			expect(result?.needsOnboarding).toBe(false);
		});

		it("transitions teamless state to active workspace state on invite acceptance", () => {
			// Use a type annotation that widens activeTeam away from the literal null
			// so TypeScript can verify the post-patch .id access without inference
			// narrowing activeTeam to never.
			const old: {
				isAuthenticated: boolean;
				user: { id: string; name: string };
				activeTeam: WorkspacePatch["activeTeam"];
				membership: WorkspacePatch["membership"];
				needsOnboarding: boolean;
			} = {
				isAuthenticated: true,
				user: { id: "u1", name: "User" },
				activeTeam: null,
				membership: null,
				needsOnboarding: true,
			};
			const result = applyWorkspacePatchToViewer(old, mockPatch);
			expect(result?.activeTeam).not.toBeNull();
			expect(result?.activeTeam?.id).toBe("team-2");
			expect(result?.membership).not.toBeNull();
			expect(result?.needsOnboarding).toBe(false);
		});

		it("carries the full settings block from the patch", () => {
			// Use a type annotation that widens activeTeam away from the literal null
			// so TypeScript can verify the post-patch .settings access.
			const old: {
				isAuthenticated: boolean;
				user: null;
				activeTeam: WorkspacePatch["activeTeam"];
				membership: WorkspacePatch["membership"];
				needsOnboarding: boolean;
			} = {
				isAuthenticated: true,
				user: null,
				activeTeam: null,
				membership: null,
				needsOnboarding: true,
			};
			const result = applyWorkspacePatchToViewer(old, mockPatch);
			expect(result?.activeTeam?.settings?.baseCurrency).toBe("USD");
			expect(result?.activeTeam?.settings?.countryCode).toBe("US");
		});
	});
});

describe("applyWorkspacePatchToPrivateData", () => {
	describe("undefined old cache", () => {
		it("returns undefined when existing cache is undefined", () => {
			expect(
				applyWorkspacePatchToPrivateData(undefined, mockPatch)
			).toBeUndefined();
		});
	});

	describe("non-workspace fields preserved", () => {
		it("preserves message and user from existing cache", () => {
			const old = {
				message: "This is private",
				user: { id: "u1", name: "User" },
				activeTeam: {
					id: "team-1",
					name: "Old Team",
					logoUrl: null,
					settings: null,
				},
				membership: { role: "member", teamId: "team-1" },
			};
			const result = applyWorkspacePatchToPrivateData(old, mockPatch);
			expect(result?.message).toBe("This is private");
			expect(result?.user).toEqual({ id: "u1", name: "User" });
		});
	});

	describe("workspace fields overwritten", () => {
		it("overwrites activeTeam and membership with patch values", () => {
			const old = {
				message: "This is private",
				user: { id: "u1", name: "User" },
				activeTeam: {
					id: "team-1",
					name: "Old Team",
					logoUrl: null,
					settings: null,
				},
				membership: { role: "member", teamId: "team-1" },
			};
			const result = applyWorkspacePatchToPrivateData(old, mockPatch);
			expect(result?.activeTeam?.id).toBe("team-2");
			expect(result?.activeTeam?.name).toBe("New Team");
			expect(result?.membership?.teamId).toBe("team-2");
		});
	});

	describe("null-patch safety", () => {
		it("returns existing cache unchanged when patch has no active workspace", () => {
			const old = {
				message: "This is private",
				user: { id: "u1" },
				activeTeam: {
					id: "team-1",
					name: "Old Team",
					logoUrl: null,
					settings: null,
				},
				membership: { role: "member", teamId: "team-1" },
			};
			const result = applyWorkspacePatchToPrivateData(old, nullPatch);
			expect(result?.activeTeam?.id).toBe("team-1");
			expect(result?.membership?.teamId).toBe("team-1");
		});
	});
});
