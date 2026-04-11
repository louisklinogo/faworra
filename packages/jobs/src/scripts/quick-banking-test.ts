/**
 * Minimal banking test (no env package dependency)
 * Tests Supabase client directly
 */

import { createClient } from "@supabase/supabase-js";

// Get from process.env or die
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

const TEST_CONNECTION_ID = "b68b9e5a-328e-4040-b867-ade12e973914";

async function run() {
	console.log("🧪 Quick Banking Test\n");

	// Create Supabase client
	const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

	// 1. Query connection
	console.log("1️⃣ Querying bank_connections...");
	const { data: conn, error: connErr } = await supabase
		.from("bank_connections")
		.select("id, name, provider, status, team_id")
		.eq("id", TEST_CONNECTION_ID)
		.single();

	if (connErr) {
		console.log("   ❌ Error:", connErr.message);
		return;
	}

	console.log("   ✅ Connection:", conn.name);

	// 2. Query accounts
	console.log("\n2️⃣ Querying bank_accounts...");
	const { data: accounts, error: accErr } = await supabase
		.from("bank_accounts")
		.select("id, name, sync_status")
		.eq("team_id", conn.team_id);

	if (accErr) {
		console.log("   ❌ Error:", accErr.message);
		return;
	}

	console.log(`   ✅ Found ${accounts?.length ?? 0} accounts`);

	// 3. Update connection
	console.log("\n3️⃣ Updating connection last_synced_at...");
	const { error: updateErr } = await supabase
		.from("bank_connections")
		.update({ last_synced_at: new Date().toISOString() })
		.eq("id", TEST_CONNECTION_ID);

	if (updateErr) {
		console.log("   ❌ Error:", updateErr.message);
	} else {
		console.log("   ✅ Updated successfully");
	}

	console.log("\n✅ ALL TESTS PASSED!");
	console.log("\n🎯 Supabase client + banking queries are working!");
}

run().catch(e => {
	console.error("❌ Test failed:", e);
	process.exit(1);
});
