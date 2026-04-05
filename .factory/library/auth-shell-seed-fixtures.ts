import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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
	".factory/validation/auth-shell-parity/user-testing/fixtures.json"
);
const apiBaseUrl = "http://api.faworra.localhost:1355";
const bunStorePath = resolve(repoRoot, "node_modules/.bun");

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

const namespace = process.argv[2] ?? `auth-shell-${Date.now()}`;
const outputPath = process.argv[3]
	? resolve(process.cwd(), process.argv[3])
	: defaultOutputPath;
const password = "Password123!";

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

const createInviteExpiryDate = () =>
	new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

const signUpUser = async (label: string) => {
	const email = `${namespace}-${label}@example.com`;
	const name = `Auth Shell ${label}`;
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
			id: string;
			email: string;
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

const users = {
	ready: await signUpUser("ready"),
	teamless: await signUpUser("teamless"),
	reactivation: await signUpUser("reactivation"),
	staleFallback: await signUpUser("stale-fallback"),
	conflicting: await signUpUser("conflicting"),
	foreign: await signUpUser("foreign"),
};

const readyWorkspace = await createWorkspace({
	name: `${namespace} Ready Workspace`,
	userId: users.ready.id,
	role: "owner",
	baseCurrency: "GHS",
	countryCode: "GH",
});

await upsertUserContext({
	userId: users.ready.id,
	activeMembershipId: readyWorkspace.membership.id,
	activeTeamId: readyWorkspace.team.id,
});

const foreignWorkspace = await createWorkspace({
	name: `${namespace} Foreign Workspace`,
	userId: users.foreign.id,
	role: "owner",
	baseCurrency: "USD",
	countryCode: "US",
});

await upsertUserContext({
	userId: users.foreign.id,
	activeMembershipId: foreignWorkspace.membership.id,
	activeTeamId: foreignWorkspace.team.id,
});

const reactivationWorkspace = await createWorkspace({
	name: `${namespace} Reactivation Workspace`,
	userId: users.reactivation.id,
	role: "owner",
	baseCurrency: "EUR",
	countryCode: "FR",
});

const staleFallbackWorkspace = await createWorkspace({
	name: `${namespace} Stale Fallback Workspace`,
	userId: users.staleFallback.id,
	role: "owner",
	baseCurrency: "GBP",
	countryCode: "GB",
});

await upsertUserContext({
	userId: users.staleFallback.id,
	activeMembershipId: null,
	activeTeamId: foreignWorkspace.team.id,
});

const conflictingPrimaryWorkspace = await createWorkspace({
	name: `${namespace} Conflicting Primary Workspace`,
	userId: users.conflicting.id,
	role: "owner",
	baseCurrency: "KES",
	countryCode: "KE",
});

const [conflictingSecondaryMembership] = await db
	.insert(teamMemberships)
	.values({
		userId: users.conflicting.id,
		teamId: foreignWorkspace.team.id,
		role: "member",
	})
	.returning();

if (!conflictingSecondaryMembership) {
	throw new Error("Failed to create conflicting secondary membership");
}

await upsertUserContext({
	userId: users.conflicting.id,
	activeMembershipId: conflictingPrimaryWorkspace.membership.id,
	activeTeamId: foreignWorkspace.team.id,
});

const [pendingInvite] = await db
	.insert(teamInvites)
	.values({
		teamId: foreignWorkspace.team.id,
		email: users.ready.email,
		normalizedEmail: users.ready.email,
		role: "member",
		status: "pending",
		tokenHash: hashInviteToken(randomUUID()),
		invitedByUserId: users.foreign.id,
		expiresAt: createInviteExpiryDate(),
	})
	.returning();

if (!pendingInvite) {
	throw new Error("Failed to create pending invite for ready user");
}

const fixtures = {
	apiBaseUrl,
	dashboardBaseUrl: "http://dashboard.faworra.localhost:1355",
	generatedAt: new Date().toISOString(),
	namespace,
	users,
	workspaces: {
		ready: readyWorkspace,
		foreign: foreignWorkspace,
		reactivation: reactivationWorkspace,
		staleFallback: staleFallbackWorkspace,
		conflictingPrimary: conflictingPrimaryWorkspace,
		conflictingSecondaryMembership,
	},
	pendingInvite,
	invalidSwitchMembershipId: foreignWorkspace.membership.id,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(fixtures, null, 2)}\n`);
console.log(JSON.stringify(fixtures, null, 2));

await pool.end();
