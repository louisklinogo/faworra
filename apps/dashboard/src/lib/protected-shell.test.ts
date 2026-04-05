import { describe, expect, it } from "bun:test";

import { resolveShellRedirect, type ShellViewerState } from "./protected-shell";

const READY_TEAM = { id: "team-1", name: "Acme" };

const guestState: ShellViewerState = {
	isAuthenticated: false,
	needsOnboarding: false,
	activeTeam: null,
};

const teamlessState: ShellViewerState = {
	isAuthenticated: true,
	needsOnboarding: true,
	activeTeam: null,
};

const readyState: ShellViewerState = {
	isAuthenticated: true,
	needsOnboarding: false,
	activeTeam: READY_TEAM,
};

describe("resolveShellRedirect", () => {
	describe("unauthenticated visitors", () => {
		it("redirects guests to /login with the current path as return_to", () => {
			const result = resolveShellRedirect(guestState, "/dashboard");
			expect(result).toBe("/login?return_to=%2Fdashboard");
		});

		it("preserves query string in return_to", () => {
			const result = resolveShellRedirect(guestState, "/dashboard?tab=billing");
			expect(result).toBe("/login?return_to=%2Fdashboard%3Ftab%3Dbilling");
		});

		it("uses /dashboard as the return_to fallback for unsafe paths", () => {
			// getSafeReturnTo neutralises external paths to /dashboard
			const result = resolveShellRedirect(guestState, "https://evil.example");
			expect(result).toBe("/login?return_to=%2Fdashboard");
		});
	});

	describe("authenticated but teamless users", () => {
		it("redirects users who need onboarding to /teams (invite-recovery surface)", () => {
			const result = resolveShellRedirect(teamlessState, "/dashboard");
			expect(result).toBe("/teams");
		});

		it("redirects users with no activeTeam to /teams regardless of needsOnboarding flag", () => {
			// The teams page splits further: pending invites → invite-recovery UI;
			// no invites at all → onboarding.  The shell simply sends teamless
			// users to the recovery surface unconditionally.
			const withTeam: ShellViewerState = {
				isAuthenticated: true,
				needsOnboarding: false, // flag says ready but no team yet
				activeTeam: null,
			};
			expect(resolveShellRedirect(withTeam, "/dashboard")).toBe("/teams");
		});
	});

	describe("authenticated users with a ready workspace", () => {
		it("returns null (no redirect needed) for ready users", () => {
			expect(resolveShellRedirect(readyState, "/dashboard")).toBeNull();
		});

		it("returns null on deeply nested protected paths", () => {
			expect(
				resolveShellRedirect(readyState, "/dashboard/settings/team")
			).toBeNull();
		});
	});
});
