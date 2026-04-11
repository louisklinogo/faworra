/**
 * Mono webhook handler
 * Midday parity: receives async events from Mono and triggers jobs
 *
 * Reference: midday/apps/api/src/rest/routers/webhooks/plaid/index.ts
 * Mono docs: docs/mono/financial-data/webhook-introduction.md
 *
 * Architecture note: Uses Supabase client for database access (Midday banking pattern)
 * This matches how Midday handles banking webhooks and background jobs.
 *
 * Events handled:
 * - mono.events.account_connected
 * - mono.events.account_updated
 * - mono.events.account_removed
 * - mono.events.data_available
 */

import { createClient } from "@faworra-new/supabase/job";
import { tasks } from "@trigger.dev/sdk";
import { Hono } from "hono";

const monoWebhook = new Hono();

// ─── Webhook Route Handler ─────────────────────────────────────────────────────

monoWebhook.post("/", async (c) => {
	console.log("[webhook/mono] Received webhook");

	try {
		// Get raw body for signature verification
		const rawBody = await c.req.text();

		// Phase 2: Verify signature (disabled for testing)
		// const signature = c.req.header("X-Mono-Signature") ?? "";
		// const secretKey = process.env.MONO_SECRET_KEY ?? "";
		// if (secretKey && !await verifySignature(rawBody, signature, secretKey)) {
		//   console.error("[webhook/mono] Invalid signature");
		//   return c.json({ error: "Invalid signature" }, 401);
		// }

		// Parse payload
		const payload = JSON.parse(rawBody) as {
			event: string;
			data: Record<string, unknown>;
		};

		console.log("[webhook/mono] Event:", payload.event);

		// Route to appropriate handler
		switch (payload.event) {
			case "mono.events.account_connected":
				await handleAccountConnected(payload.data);
				break;

			case "mono.events.account_updated":
				await handleAccountUpdated(payload.data);
				break;

			case "mono.events.account_removed":
				await handleAccountRemoved(payload.data);
				break;

			case "mono.events.data_available":
				await handleDataAvailable(payload.data);
				break;

			default:
				console.warn("[webhook/mono] Unknown event:", payload.event);
		}

		// Always return 200 to acknowledge receipt
		return c.json({ success: true });
	} catch (error) {
		console.error("[webhook/mono] Error processing webhook:", error);

		// Still return 200 to avoid retries from Mono
		return c.json({ success: true, error: "Processing error" });
	}
});

// ─── Event Processors ──────────────────────────────────────────────────────────

/**
 * Handle account_connected event
 * Mono sends this when a user successfully links their account
 */
async function handleAccountConnected(
	data: Record<string, unknown>
): Promise<void> {
	console.log("[webhook/mono] account_connected event", data);

	const accountId = data.id as string | undefined;
	if (!accountId) {
		console.warn("[webhook/mono] account_connected missing id");
		return;
	}

	// TODO Phase 3: Create bank_connection and bank_accounts records
	// 1. Create bank_connection record in database
	// 2. Fetch account details from Mono API
	// 3. Create bank_account records
	// 4. Trigger initial transaction sync
}

/**
 * Handle account_updated event
 * Mono sends this when account data status changes
 *
 * Midday parity: matches Plaid ITEM webhook pattern
 * Uses Supabase client for team-scoped queries
 */
async function handleAccountUpdated(
	data: Record<string, unknown>
): Promise<void> {
	console.log("[webhook/mono] account_updated event", data);

	const accountId = data.id as string | undefined;
	if (!accountId) {
		console.warn("[webhook/mono] account_updated missing id");
		return;
	}

	// Midday parity: use Supabase client with service role
	const supabase = createClient();

	// Query bank connection by enrollment_id
	const { data: connectionData, error } = await supabase
		.from("bank_connections")
		.select("id, team_id, status")
		.eq("enrollment_id", accountId)
		.single();

	if (error || !connectionData) {
		console.warn("[webhook/mono] account_updated: connection not found", {
			accountId,
		});
		return;
	}

	// Update connection status based on event
	if (data.status === "linked") {
		await supabase
			.from("bank_connections")
			.update({ status: "connected" })
			.eq("id", connectionData.id);
	}

	console.log("[webhook/mono] account_updated: connection updated", {
		connectionId: connectionData.id,
		status: data.status,
	});
}

/**
 * Handle account_removed event
 * Mono sends this when user revokes connection
 *
 * Midday parity: matches Plaid USER_PERMISSION_REVOKED pattern
 * Uses Supabase client for cascading updates
 */
async function handleAccountRemoved(
	data: Record<string, unknown>
): Promise<void> {
	console.log("[webhook/mono] account_removed event", data);

	const accountId = data.id as string | undefined;
	if (!accountId) {
		console.warn("[webhook/mono] account_removed missing id");
		return;
	}

	// Midday parity: use Supabase client
	const supabase = createClient();

	// Query bank connection
	const { data: connectionData, error } = await supabase
		.from("bank_connections")
		.select("id, team_id")
		.eq("enrollment_id", accountId)
		.single();

	if (error || !connectionData) {
		console.warn("[webhook/mono] account_removed: connection not found", {
			accountId,
		});
		return;
	}

	// Mark connection as disconnected
	await supabase
		.from("bank_connections")
		.update({ status: "disconnected" })
		.eq("id", connectionData.id);

	// Disable all bank accounts for this connection
	await supabase
		.from("bank_accounts")
		.update({ enabled: false })
		.eq("bank_connection_id", connectionData.id);

	console.log("[webhook/mono] account_removed: connection disconnected", {
		connectionId: connectionData.id,
	});
}

/**
 * Handle data_available event
 * Mono sends this when new data is ready for retrieval
 *
 * Midday parity: triggers transaction sync via Trigger.dev tasks.trigger()
 * Reference: midday/apps/api/src/rest/routers/webhooks/plaid/index.ts line 210
 */
async function handleDataAvailable(
	data: Record<string, unknown>
): Promise<void> {
	console.log("[webhook/mono] data_available event", data);

	// Extract the account ID from Mono webhook payload
	const accountId = data.id as string | undefined;
	if (!accountId) {
		console.warn("[webhook/mono] data_available missing id");
		return;
	}

	// Midday parity: use Supabase client
	const supabase = createClient();

	// Query bank connection by enrollment_id
	const { data: connectionData, error } = await supabase
		.from("bank_connections")
		.select("id, team_id")
		.eq("enrollment_id", accountId)
		.single();

	if (error || !connectionData) {
		console.warn("[webhook/mono] data_available: connection not found", {
			accountId,
		});
		return;
	}

	console.log("[webhook/mono] data_available: triggering sync", {
		connectionId: connectionData.id,
		teamId: connectionData.team_id,
	});

	// Midday parity: use tasks.trigger() from @trigger.dev/sdk
	// Reference: midday/apps/api/src/rest/routers/webhooks/plaid/index.ts
	await tasks.trigger("sync-connection", {
		connectionId: connectionData.id,
		manualSync: false,
	});
}

export default monoWebhook;
