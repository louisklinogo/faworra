/**
 * Seed test data for banking sync testing
 *
 * Usage: bun packages/db/src/scripts/seed-test-banking.ts
 *
 * This creates:
 * - A test bank_connection for Mono provider
 * - A test bank_account linked to the connection
 *
 * Pre-requisite: User must exist (create via dashboard signup)
 *
 * @ts-nocheck - Development utility script, strict checking not required
 */

// @ts-nocheck
import { db } from "../index";
import { bankConnections, bankAccounts, teams } from "../schema";
import { eq } from "drizzle-orm";

async function main() {
	console.log("🌱 Seeding test banking data...\n");

	// Check for existing test user
	const existingUser = await db.query.user.findFirst();

	if (!existingUser) {
		console.log("❌ No users found. Please create a user first via Better Auth.");
		console.log("   Tip: Start the dashboard and sign up at http://dashboard.faworra.localhost:1355");
		process.exit(1);
	}

	console.log(`✓ Found user: ${existingUser.id}`);

	// Get or create test team
	const existingTeams = await db.query.teams.findMany();
	let team = existingTeams.at(0);

	if (!team) {
		console.log("Creating test team...");
		const [newTeam] = await db
			.insert(teams)
			.values({
				name: "Test Banking Team",
				slug: "test-banking-team",
			})
			.returning();
		team = newTeam;
		console.log(`✓ Created team: ${team.id}`);
	} else {
		console.log(`✓ Using existing team: ${team.id}`);
	}

	// Check for existing bank connection
	const existingConnections = await db
		.select()
		.from(bankConnections)
		.where(eq(bankConnections.teamId, team.id));

	let connection = existingConnections.at(0);

	if (!connection) {
		console.log("\nCreating test bank connection...");
		const [newConnection] = await db
			.insert(bankConnections)
			.values({
				teamId: team.id,
				name: "Ghana Commercial Bank (Test)",
				institutionName: "GCB Bank",
				provider: "mono",
				enrollmentId: `test_enrollment_${Date.now()}`,
				status: "connected",
				lastSyncedAt: null,
			})
			.returning();
		connection = newConnection;
		console.log(`✓ Created connection: ${connection.id}`);
	} else {
		console.log(`\n✓ Using existing connection: ${connection.id}`);
	}

	// Check for existing bank accounts
	const existingAccounts = await db
		.select()
		.from(bankAccounts)
		.where(eq(bankAccounts.teamId, team.id));

	let account = existingAccounts.at(0);

	if (!account) {
		console.log("Creating test bank account...");
		const [newAccount] = await db
			.insert(bankAccounts)
			.values({
				teamId: team.id,
				bankConnectionId: connection.id,
				name: "GCB Savings Account",
				currency: "GHS",
				type: "bank", // Valid enum: bank, momo, cash, other
				externalId: `test_account_${Date.now()}`,
				enabled: true,
				manual: false,
				balance: 500000,
				availableBalance: 450000,
				syncStatus: "pending",
			})
			.returning();
		account = newAccount;
		console.log(`✓ Created account: ${account.id}`);
	} else {
		console.log(`✓ Using existing account: ${account.id}`);
		// Provider-linked accounts must be manual=false or sync-connection skips them
		if (
			account.bankConnectionId === connection.id &&
			account.manual !== false
		) {
			console.log("   Patching manual=false for provider-linked sync...");
			await db
				.update(bankAccounts)
				.set({ manual: false })
				.where(eq(bankAccounts.id, account.id));
		}
	}

	// Summary - assert all data exists
	if (!team || !connection || !account) {
		console.error("❌ Missing test data");
		process.exit(1);
	}

	console.log("\n" + "=".repeat(60));
	console.log("📊 Test Data Summary");
	console.log("=".repeat(60));
	console.log(`Team ID:        ${team.id}`);
	console.log(`Connection ID:  ${connection.id}`);
	console.log(`Account ID:     ${account.id}`);
	console.log(`Provider:       mono`);
	console.log(`Status:         ${connection.status}`);
	console.log(`External ID:    ${account.externalId ?? "none"}`);
	console.log("=".repeat(60));

	console.log("\n🚀 Ready to test!");
	console.log("\nOption 1: Trigger via API (requires running dev server)");
	console.log(`  curl -X POST http://api.faworra.localhost:1355/test/sync-bank \\`);
	console.log(`    -H "Content-Type: application/json" \\`);
	console.log(`    -d '{"connectionId": "${connection.id}"}'`);

	console.log("\nOption 2: Trigger via Trigger.dev dashboard");
	console.log("  1. Open the Trigger.dev UI");
	console.log("  2. Find 'sync-connection' task");
	console.log(`  3. Trigger with payload: {"connectionId": "${connection.id}", "manualSync": true}`);

	console.log("\nOption 3: View data via test endpoint");
	console.log("  curl http://api.faworra.localhost:1355/test/banking-data");

	process.exit(0);
}

main().catch((error) => {
	console.error("❌ Error:", error);
	process.exit(1);
});
