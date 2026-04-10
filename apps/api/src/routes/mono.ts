/**
 * Mono webhook handler
 * Midday parity: receives async events from Mono and triggers jobs
 * 
 * Reference: midday-wiki/content/Shared Packages/Banking Integration (@midday_banking).md
 * Mono docs: docs/mono/financial-data/webhook-introduction.md
 * 
 * Events handled:
 * - mono.events.account_connected
 * - mono.events.account_updated
 * - mono.events.account_removed
 * - mono.events.data_available
 */

import { Hono } from "hono";
import { db, bankConnections, bankAccounts, eq } from "@faworra-new/db";
import { syncConnection } from "@faworra-new/jobs/tasks/bank/sync/connection";

const monoWebhook = new Hono();

// ─── Webhook Route Handler ─────────────────────────────────────────────────────

monoWebhook.post("/", async (c) => {
	console.log("[webhook/mono] Received webhook");
	
	try {
		// Get raw body for signature verification
		const rawBody = await c.req.text();
		
		// Verify signature (disabled for testing)
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
		return c.json({ received: true });
		
	} catch (error) {
		console.error("[webhook/mono] Error processing webhook:", error);
		
		// Still return 200 to avoid retries from Mono
		return c.json({ received: true, error: "Processing error" });
	}
});

// ─── Event Processors ──────────────────────────────────────────────────────────

/**
 * Handle account_connected event
 * Mono sends this when a user successfully links their account
 */
async function handleAccountConnected(data: Record<string, unknown>): Promise<void> {
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
	// 4. Trigger initial transaction sync via syncConnection
}

/**
 * Handle account_updated event
 * Mono sends this when account data status changes
 */
async function handleAccountUpdated(data: Record<string, unknown>): Promise<void> {
	console.log("[webhook/mono] account_updated event", data);
	
	const accountId = data.id as string | undefined;
	if (!accountId) {
		console.warn("[webhook/mono] account_updated missing id");
		return;
	}
	
	// Find connection by enrollment ID
	const [connection] = await db
		.select()
		.from(bankConnections)
		.where(eq(bankConnections.enrollmentId, accountId))
		.limit(1);
	
	if (!connection) {
		console.warn("[webhook/mono] account_updated: connection not found", { accountId });
		return;
	}
	
	// Update connection status based on event
	if (data.status === "linked") {
		await db
			.update(bankConnections)
			.set({
				status: "connected",
				detailStatus: "linked",
				updatedAt: new Date(),
			})
			.where(eq(bankConnections.id, connection.id));
	}
	
	console.log("[webhook/mono] account_updated: connection updated", {
		connectionId: connection.id,
		status: data.status,
	});
}

/**
 * Handle account_removed event
 * Mono sends this when user revokes connection
 */
async function handleAccountRemoved(data: Record<string, unknown>): Promise<void> {
	console.log("[webhook/mono] account_removed event", data);
	
	const accountId = data.id as string | undefined;
	if (!accountId) {
		console.warn("[webhook/mono] account_removed missing id");
		return;
	}
	
	// Find connection by enrollment ID
	const [connection] = await db
		.select()
		.from(bankConnections)
		.where(eq(bankConnections.enrollmentId, accountId))
		.limit(1);
	
	if (!connection) {
		console.warn("[webhook/mono] account_removed: connection not found", { accountId });
		return;
	}
	
	// Mark connection as disconnected
	await db
		.update(bankConnections)
		.set({
			status: "disconnected",
			updatedAt: new Date(),
		})
		.where(eq(bankConnections.id, connection.id));
	
	// Mark related accounts as disabled
	await db
		.update(bankAccounts)
		.set({
			enabled: false,
			updatedAt: new Date(),
		})
		.where(eq(bankAccounts.bankConnectionId, connection.id));
	
	console.log("[webhook/mono] account_removed: connection disconnected", {
		connectionId: connection.id,
	});
}

/**
 * Handle data_available event
 * Mono sends this when new data is ready for retrieval
 * 
 * Midday parity: triggers transaction sync via Trigger.dev
 * Reference: midday/apps/api/src/routes/banking/webhook.ts
 */
async function handleDataAvailable(data: Record<string, unknown>): Promise<void> {
	console.log("[webhook/mono] data_available event", data);
	
	// Extract the account ID from Mono webhook payload
	const accountId = data.id as string | undefined;
	if (!accountId) {
		console.warn("[webhook/mono] data_available missing id");
		return;
	}
	
	// Find connection by enrollment ID
	const [connection] = await db
		.select()
		.from(bankConnections)
		.where(eq(bankConnections.enrollmentId, accountId))
		.limit(1);
	
	if (!connection) {
		console.warn("[webhook/mono] data_available: connection not found", { accountId });
		return;
	}
	
	console.log("[webhook/mono] data_available: triggering sync", {
		connectionId: connection.id,
		teamId: connection.teamId,
	});
	
	// Trigger syncConnection task via Trigger.dev
	await syncConnection.trigger({
		connectionId: connection.id,
		teamId: connection.teamId,
		manualSync: false,
	});
}

export default monoWebhook;
