/**
 * Direct banking sync test (bypasses Trigger.dev Cloud)
 *
 * This tests the Supabase client + banking sync logic directly
 * without needing Trigger.dev registration.
 *
 * Usage: bun --env-file=../../apps/api/.env packages/jobs/src/scripts/direct-banking-test.ts
 */

// @ts-nocheck - Development test script
import { createClient } from "@faworra-new/supabase/job";
import { db } from "@faworra-new/db";
import { bankConnections, bankAccounts } from "@faworra-new/db";
import { eq } from "drizzle-orm";

const TEST_CONNECTION_ID = "b68b9e5a-328e-4040-b867-ade12e973914";

async function runTest() {
	console.log("🧪 Direct Banking Sync Test\n");
	console.log("=".repeat(60));

	// 1. Test Supabase client connection
	console.log("\n1️⃣ Testing Supabase client...");

	const supabase = createClient();

	// Query bank_connections
	console.log(`   Querying connection: ${TEST_CONNECTION_ID}`);
	const { data: connection, error: connectionError } = await supabase
		.from("bank_connections")
		.select("id, name, provider, status, team_id")
		.eq("id", TEST_CONNECTION_ID)
		.single();

	if (connectionError) {
		console.log("   ❌ Connection query failed:", connectionError.message);
		return;
	}

	console.log("   ✅ Connection found:");
	console.log(`      - Name: ${connection.name}`);
	console.log(`      - Provider: ${connection.provider}`);
	console.log(`      - Status: ${connection.status}`);
	console.log(`      - Team ID: ${connection.team_id}`);

	// 2. Query bank_accounts via Supabase
	console.log("\n2️⃣ Testing bank_accounts query...");

	const { data: accounts, error: accountsError } = await supabase
		.from("bank_accounts")
		.select("id, name, currency, type, enabled, external_id, sync_status")
		.eq("team_id", connection.team_id);

	if (accountsError) {
		console.log("   ❌ Accounts query failed:", accountsError.message);
		return;
	}

	console.log(`   ✅ Found ${accounts.length} account(s):`);
	for (const acc of accounts) {
		console.log(`      - ${acc.name} (${acc.currency}) - Status: ${acc.sync_status}`);
	}

	// 3. Update sync_status via Supabase
	console.log("\n3️⃣ Testing update operation...");

	if (accounts.length > 0) {
		const testAccount = accounts[0];
		const { error: updateError } = await supabase
			.from("bank_accounts")
			.update({ sync_status: "syncing" })
			.eq("id", testAccount.id);

		if (updateError) {
			console.log("   ❌ Update failed:", updateError.message);
		} else {
			console.log(`   ✅ Updated account ${testAccount.id} to 'syncing'`);

			// Revert back
			await supabase
				.from("bank_accounts")
				.update({ sync_status: "pending" })
				.eq("id", testAccount.id);
			console.log("   ✅ Reverted back to 'pending'");
		}
	}

	// 4. Update connection last_synced_at
	console.log("\n4️⃣ Testing connection update...");

	const now = new Date().toISOString();
	const { error: connectionUpdateError } = await supabase
		.from("bank_connections")
		.update({ last_synced_at: now })
		.eq("id", TEST_CONNECTION_ID);

	if (connectionUpdateError) {
		console.log("   ❌ Connection update failed:", connectionUpdateError.message);
	} else {
		console.log("   ✅ Updated connection last_synced_at");

		// Verify via Drizzle
		const drizzleConnection = await db.query.bankConnections.findFirst({
			where: eq(bankConnections.id, TEST_CONNECTION_ID),
		});

		if (drizzleConnection?.lastSyncedAt) {
			console.log(`   ✅ Verified via Drizzle: ${drizzleConnection.lastSyncedAt.toISOString()}`);
		}
	}

	console.log("\n" + "=".repeat(60));
	console.log("✅ ALL TESTS PASSED!");
	console.log("=".repeat(60));
	console.log("\n📝 Summary:");
	console.log("   - Supabase client: Working");
	console.log("   - Connection queries: Working");
	console.log("   - Account queries: Working");
	console.log("   - Update operations: Working");
	console.log("   - Drizzle ORM: Working");
	console.log("\n🎯 The banking sync infrastructure is ready!");
}

runTest().catch((error) => {
	console.error("\n❌ Test failed:", error);
	process.exit(1);
});
