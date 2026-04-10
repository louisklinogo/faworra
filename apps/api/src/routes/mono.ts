/**
 * Mono webhook handler
 * Midday parity: receives async events from Mono
 * 
 * Reference: midday-wiki/content/Shared Packages/Banking Integration (@midday_banking).md
 * 
 * Mono docs: docs/mono/financial-data/webhook-introduction.md
 * 
 * Events handled:
 * - mono.events.account_connected
 * - mono.events.account_updated
 * - mono.events.account_removed
 * - mono.events.data_available
 */

import { Hono } from "hono";

const monoWebhook = new Hono();

// ─── Webhook Signature Verification (Phase 2) ─────────────────────────────────

/**
 * Verify Mono webhook signature
 * Mono docs reference: docs/mono/financial-data/webhook-introduction.md
 * 
 * TODO: Phase 2 implementation
 * - Extract X-Mono-Signature header
 * - Compute HMAC-SHA256 of raw body
 * - Compare with signature
 */
// Phase 2: Implement this function
// function verifySignature(payload: string, signature: string): boolean {
//   console.log("[webhook/mono] Signature verification not implemented");
//   return true;
// }

// ─── Event Processors ──────────────────────────────────────────────────────────

/**
 * Handle account_connected event
 * Mono sends this when a user successfully links their account
 */
async function handleAccountConnected(data: Record<string, unknown>): Promise<void> {
	console.log("[webhook/mono] account_connected event", data);
	
	// TODO: Phase 2 implementation
	// 1. Extract account ID from data
	// 2. Create bank_connection record in database
	// 3. Fetch account details from Mono API
	// 4. Create bank_account records
	// 5. Trigger initial transaction sync via Trigger.dev
}

/**
 * Handle account_updated event
 * Mono sends this when account data status changes
 */
async function handleAccountUpdated(data: Record<string, unknown>): Promise<void> {
	console.log("[webhook/mono] account_updated event", data);
	
	// TODO: Phase 2 implementation
	// 1. Extract account and data status from payload
	// 2. Update bank_connection.detailStatus in database
	// 3. If status is 'available', trigger transaction sync
}

/**
 * Handle account_removed event
 * Mono sends this when user revokes connection
 */
async function handleAccountRemoved(data: Record<string, unknown>): Promise<void> {
	console.log("[webhook/mono] account_removed event", data);
	
	// TODO: Phase 2 implementation
	// 1. Extract account ID
	// 2. Mark bank_connection as disconnected
	// 3. Soft-delete related bank_accounts
}

/**
 * Handle data_available event
 * Mono sends this when new data is ready for retrieval
 */
async function handleDataAvailable(data: Record<string, unknown>): Promise<void> {
	console.log("[webhook/mono] data_available event", data);
	
	// TODO: Phase 2 implementation
	// 1. Trigger transaction sync job via packages/jobs
	// 2. Or enqueue with packages/job-client for BullMQ
}

// ─── Webhook Route Handler ─────────────────────────────────────────────────────

monoWebhook.post("/", async (c) => {
	console.log("[webhook/mono] Received webhook");
	
	try {
		// Get raw body for signature verification
		const rawBody = await c.req.text();
		
		// Phase 2: Get signature header and verify
		// const signature = c.req.header("X-Mono-Signature") ?? "";
		// if (!verifySignature(rawBody, signature)) {
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
		
		// Still return 200 to avoid retries
		return c.json({ received: true, error: "Processing error" });
	}
});

export default monoWebhook;
