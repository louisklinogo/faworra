import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { userContext } from "../../packages/db/src/schema/core";
import {
	teamInvites,
	teamMemberships,
	teamSettings,
	teams,
} from "../../packages/db/src/schema/team";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..", "..");
const envPath = resolve(repoRoot, "apps/api/.env");
const defaultOutputPath = resolve(
	repoRoot,
	".factory/validation/tenancy-ux-parity/user-testing/fixtures.json"
);
const apiBaseUrl = "http://api.faworra.localhost:1355";
const dashboardBaseUrl = "http://dashboard.faworra.localhost:1355";
const bunStorePath = resolve(repoRoot, "node_modules/.bun");
const password = "Password123!";

const parseEnvValue = (raw: string) => {
	if (
		(raw.startsWith('"') && raw.endsWith('"')) ||
		(raw.startsWith("'") && raw.endsWith("'"))
	) {
		return raw.slice(1, -1);
	}

	return raw;
};

for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
	if (!line || line.trimStart().startsWith("#")) {
		continue;
	}

	const separatorIndex = line.indexOf("=");
	if (separatorIndex === -1) {
		continue;
	}

	const key = line.slice(0, separatorIndex).trim();
	const value = parseEnvValue(line.slice(separatorIndex + 1).trim());

	if (!(key in process.env)) {
		process.env[key] = value;
	}
}

if (!process.env.DATABASE_URL) {
	throw new Error(`DATABASE_URL was not found in ${envPath}`);
}

const resolveBunPackageEntry = (
	storePrefix: string,
	packageName: string,
	entryPath: string
): string => {
	const match = readdirSync(bunStorePath)
		.sort()
		.find((entry) => entry.startsWith(storePrefix));

	if (!match) {
		throw new Error(
			`Could not locate ${storePrefix} in Bun store at ${bunStorePath}`
		);
	}

	return resolve(bunStorePath, match, "node_modules", packageName, entryPath);
};

const defaultNamespace = `tenancy-ux-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
const namespace = process.argv[2] ?? defaultNamespace;
const outputPath = process.argv[3]
	? resolve(process.cwd(), process.argv[3])
	: defaultOutputPath;

const [{ drizzle }, { Pool }] = await Promise.all([
	import(
		pathToFileURL(
			resolveBunPackageEntry(
				"drizzle-orm@",
				"drizzle-orm",
				"node-postgres/index.js"
			)
		).href
	),
	import(
		pathToFileURL(resolveBunPackageEntry("pg@", "pg", "esm/index.mjs")).href
	),
]);

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, {
	schema: {
		userContext,
		teamInvites,
		teamMemberships,
		teamSettings,
		teams,
	},
});

const hashInviteToken = (token: string) =>
	createHash("sha256").update(token).digest("hex");

const createInviteExpiryDate = (daysFromNow = 14) =>
	new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);

const signUpUser = async (label: string) => {
	const email = `${namespace}-${label}@example.com`;
	const name = `Tenancy UX ${label}`;
	const response = await fetch(`${apiBaseUrl}/api/auth/sign-up/email`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({
			name,
			email,
			password,
		}),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`Failed to sign up ${label} (${email}): ${response.status} ${body}`
		);
	}

	const data = (await response.json()) as {
		user: {
			email: string;
			id: string;
			name: string;
		};
	};

	return {
		email,
		id: data.user.id,
		label,
		name,
	};
};

const createWorkspace = async ({
	baseCurrency,
	countryCode,
	name,
	role,
	userId,
}: {
	baseCurrency: string;
	countryCode: string;
	name: string;
	role: "member" | "owner";
	userId: string;
}) => {
	const [team] = await db
		.insert(teams)
		.values({
			name,
		})
		.returning();

	if (!team) {
		throw new Error(`Failed to create team ${name}`);
	}

	const [membership] = await db
		.insert(teamMemberships)
		.values({
			role,
			teamId: team.id,
			userId,
		})
		.returning();

	if (!membership) {
		throw new Error(`Failed to create membership for ${name}`);
	}

	const [settings] = await db
		.insert(teamSettings)
		.values({
			teamId: team.id,
			baseCurrency,
			countryCode,
			industryKey: "fashion",
			industryConfigVersion: "v1",
		})
		.returning();

	if (!settings) {
		throw new Error(`Failed to create settings for ${name}`);
	}

	return { membership, settings, team };
};

const createMembership = async ({
	role,
	teamId,
	userId,
}: {
	role: "member" | "owner";
	teamId: string;
	userId: string;
}) => {
	const [membership] = await db
		.insert(teamMemberships)
		.values({
			role,
			teamId,
			userId,
		})
		.returning();

	if (!membership) {
		throw new Error(`Failed to create membership for ${userId} on ${teamId}`);
	}

	return membership;
};

const upsertUserContext = async ({
	activeMembershipId,
	activeTeamId,
	userId,
}: {
	activeMembershipId: string | null;
	activeTeamId: string | null;
	userId: string;
}) => {
	await db
		.insert(userContext)
		.values({
			userId,
			activeMembershipId,
			activeTeamId,
		})
		.onConflictDoUpdate({
			target: userContext.userId,
			set: {
				activeMembershipId,
				activeTeamId,
				updatedAt: new Date(),
			},
		});
};

const createInvite = async ({
	acceptedAt = null,
	acceptedByUserId = null,
	email,
	expiresAt = createInviteExpiryDate(),
	invitedByUserId,
	role = "member",
	status = "pending",
	teamId,
}: {
	acceptedAt?: Date | null;
	acceptedByUserId?: string | null;
	email: string;
	expiresAt?: Date;
	invitedByUserId: string;
	role?: "member" | "owner";
	status?: "accepted" | "expired" | "pending" | "revoked";
	teamId: string;
}) => {
	const [invite] = await db
		.insert(teamInvites)
		.values({
			acceptedAt,
			acceptedByUserId,
			email,
			expiresAt,
			invitedByUserId,
			normalizedEmail: email.toLowerCase(),
			role,
			status,
			teamId,
			tokenHash: hashInviteToken(randomUUID()),
		})
		.returning();

	if (!invite) {
		throw new Error(`Failed to create ${status} invite for ${email}`);
	}

	return invite;
};

const users = {
	apiOwner: await signUpUser("api-owner"),
	apiRecipient: await signUpUser("api-recipient"),
	browserDeclineRecipient: await signUpUser("browser-decline-recipient"),
	browserRecipient: await signUpUser("browser-recipient"),
	duplicatePending: await signUpUser("duplicate-pending"),
	mixedRole: await signUpUser("mixed-role"),
	outsider: await signUpUser("outsider"),
	repeatRecipient: await signUpUser("repeat-recipient"),
	singleOwner: await signUpUser("single-owner"),
	switcher: await signUpUser("switcher"),
};

const singleWorkspace = await createWorkspace({
	name: `${namespace} Single Workspace`,
	userId: users.singleOwner.id,
	role: "owner",
	baseCurrency: "GHS",
	countryCode: "GH",
});

await upsertUserContext({
	userId: users.singleOwner.id,
	activeMembershipId: singleWorkspace.membership.id,
	activeTeamId: singleWorkspace.team.id,
});

const switcherPrimaryWorkspace = await createWorkspace({
	name: `${namespace} Switcher Primary Workspace`,
	userId: users.switcher.id,
	role: "owner",
	baseCurrency: "USD",
	countryCode: "US",
});

const switcherSecondaryWorkspace = await createWorkspace({
	name: `${namespace} Switcher Secondary Workspace`,
	userId: users.switcher.id,
	role: "owner",
	baseCurrency: "EUR",
	countryCode: "DE",
});

await upsertUserContext({
	userId: users.switcher.id,
	activeMembershipId: switcherPrimaryWorkspace.membership.id,
	activeTeamId: switcherPrimaryWorkspace.team.id,
});

const apiOwnerWorkspace = await createWorkspace({
	name: `${namespace} API Owner Workspace`,
	userId: users.apiOwner.id,
	role: "owner",
	baseCurrency: "KES",
	countryCode: "KE",
});

await upsertUserContext({
	userId: users.apiOwner.id,
	activeMembershipId: apiOwnerWorkspace.membership.id,
	activeTeamId: apiOwnerWorkspace.team.id,
});

const mixedOwnedWorkspace = await createWorkspace({
	name: `${namespace} Mixed Owner Workspace`,
	userId: users.mixedRole.id,
	role: "owner",
	baseCurrency: "GBP",
	countryCode: "GB",
});

const mixedRoleMemberOnApiWorkspace = await createMembership({
	userId: users.mixedRole.id,
	teamId: apiOwnerWorkspace.team.id,
	role: "member",
});

await upsertUserContext({
	userId: users.mixedRole.id,
	activeMembershipId: mixedRoleMemberOnApiWorkspace.id,
	activeTeamId: apiOwnerWorkspace.team.id,
});

const outsiderWorkspace = await createWorkspace({
	name: `${namespace} Outsider Workspace`,
	userId: users.outsider.id,
	role: "owner",
	baseCurrency: "CAD",
	countryCode: "CA",
});

await upsertUserContext({
	userId: users.outsider.id,
	activeMembershipId: outsiderWorkspace.membership.id,
	activeTeamId: outsiderWorkspace.team.id,
});

const repeatRecipientMembership = await createMembership({
	userId: users.repeatRecipient.id,
	teamId: apiOwnerWorkspace.team.id,
	role: "member",
});

await upsertUserContext({
	userId: users.repeatRecipient.id,
	activeMembershipId: repeatRecipientMembership.id,
	activeTeamId: apiOwnerWorkspace.team.id,
});

const browserAcceptInvite = await createInvite({
	teamId: singleWorkspace.team.id,
	email: users.browserRecipient.email,
	invitedByUserId: users.singleOwner.id,
});

const browserDeclineInvite = await createInvite({
	teamId: singleWorkspace.team.id,
	email: users.browserDeclineRecipient.email,
	invitedByUserId: users.singleOwner.id,
});

const apiRecipientInvite = await createInvite({
	teamId: apiOwnerWorkspace.team.id,
	email: users.apiRecipient.email,
	invitedByUserId: users.apiOwner.id,
});

const duplicatePendingInvite = await createInvite({
	teamId: apiOwnerWorkspace.team.id,
	email: users.duplicatePending.email,
	invitedByUserId: users.apiOwner.id,
});

const repeatAcceptedInvite = await createInvite({
	teamId: apiOwnerWorkspace.team.id,
	email: users.repeatRecipient.email,
	invitedByUserId: users.apiOwner.id,
	status: "accepted",
	acceptedAt: new Date(),
	acceptedByUserId: users.repeatRecipient.id,
});

const revokedInviteForOutsider = await createInvite({
	teamId: singleWorkspace.team.id,
	email: users.outsider.email,
	invitedByUserId: users.singleOwner.id,
	status: "revoked",
});

const expiredInviteForOutsider = await createInvite({
	teamId: singleWorkspace.team.id,
	email: users.outsider.email,
	expiresAt: createInviteExpiryDate(-2),
	invitedByUserId: users.singleOwner.id,
});

const wrongEmailInvite = await createInvite({
	teamId: singleWorkspace.team.id,
	email: `${namespace}-wrong-email-target@example.com`,
	invitedByUserId: users.singleOwner.id,
});

const bulkInviteBatch = [
	{ email: `${namespace}-bulk-fresh-a@example.com`, role: "member" },
	{ email: `${namespace}-bulk-fresh-b@example.com`, role: "member" },
	{ email: users.mixedRole.email, role: "member" },
	{ email: users.duplicatePending.email, role: "member" },
	{ email: `${namespace}-bulk-fresh-a@example.com`, role: "member" },
] as const;

const fixtures = {
	apiBaseUrl,
	dashboardBaseUrl,
	generatedAt: new Date().toISOString(),
	namespace,
	users,
	workspaces: {
		apiOwner: apiOwnerWorkspace,
		mixedOwned: mixedOwnedWorkspace,
		outsider: outsiderWorkspace,
		single: singleWorkspace,
		switcherPrimary: switcherPrimaryWorkspace,
		switcherSecondary: switcherSecondaryWorkspace,
	},
	memberships: {
		mixedRoleApiWorkspace: mixedRoleMemberOnApiWorkspace,
		repeatRecipient: repeatRecipientMembership,
	},
	invites: {
		apiRecipient: apiRecipientInvite,
		browserAccept: browserAcceptInvite,
		browserDecline: browserDeclineInvite,
		duplicatePending: duplicatePendingInvite,
		expiredForOutsider: expiredInviteForOutsider,
		repeatAccepted: repeatAcceptedInvite,
		revokedForOutsider: revokedInviteForOutsider,
		wrongEmail: wrongEmailInvite,
	},
	bulkInviteBatch,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(fixtures, null, 2)}\n`);
console.log(JSON.stringify(fixtures, null, 2));

await pool.end();
