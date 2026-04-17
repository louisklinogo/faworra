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

import { MonoApi } from "@faworra-new/banking/providers/mono";
import { env } from "@faworra-new/env/server";
import { createClient } from "@faworra-new/supabase/job";
import { tasks } from "@trigger.dev/sdk";
import { Hono } from "hono";

import {
	normalizeMonoDetailStatus,
	parseMonoRef,
	shouldTriggerInitialMonoSync,
} from "./mono-shared";

const monoWebhook = new Hono();
const monoApi = new MonoApi();

// ─── Webhook Route Handler ─────────────────────────────────────────────────────

monoWebhook.post("/", async (c) => {
	console.log("[webhook/mono] Received webhook");

	try {
		const webhookSecret = c.req.header("mono-webhook-secret") ?? "";
		if (
			env.MONO_WEBHOOK_SECRET &&
			webhookSecret !== env.MONO_WEBHOOK_SECRET
		) {
			console.error("[webhook/mono] Invalid webhook secret");
			return c.json({ error: "Invalid webhook secret" }, 401);
		}

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

	const meta = asRecord(data.meta);
	const ref = parseMonoRef((meta?.ref as string | undefined) ?? null);

	if (!ref) {
		console.warn("[webhook/mono] account_connected missing parsable meta.ref", {
			accountId,
			meta,
		});
		return;
	}

	const supabase = createClient();
	const accountDetails = await monoApi.getAccount(accountId);
	const account = accountDetails.data?.account;
	const accountMeta = accountDetails.data?.meta;

	if (!account) {
		console.warn("[webhook/mono] account_connected account details missing data", {
			accountId,
		});
		return;
	}

	const detailStatus =
		normalizeMonoDetailStatus(meta?.data_status) ??
		normalizeMonoDetailStatus(accountMeta?.data_status) ??
		"processing";
	const institutionName = account.institution?.name ?? null;
	const connectionName = institutionName ?? account.name ?? "Mono Connection";
	const now = new Date().toISOString();

	const { data: existingConnection, error: existingConnectionError } =
		await supabase
			.from("bank_connections")
			.select("id, last_synced_at")
			.eq("enrollment_id", accountId)
			.maybeSingle();

	if (existingConnectionError) {
		throw existingConnectionError;
	}

	const connectionPayload = {
		team_id: ref.teamId,
		name: connectionName,
		institution_name: institutionName,
		provider: "mono",
		enrollment_id: accountId,
		status: "connected" as const,
		detail_status: detailStatus,
		updated_at: now,
	};

	let connectionId = existingConnection?.id;
	let lastSyncedAt = existingConnection?.last_synced_at ?? null;

	if (existingConnection) {
		const { error: updateConnectionError } = await supabase
			.from("bank_connections")
			.update(connectionPayload)
			.eq("id", existingConnection.id);

		if (updateConnectionError) {
			throw updateConnectionError;
		}
	} else {
		const { data: createdConnection, error: createConnectionError } =
			await supabase
				.from("bank_connections")
				.insert({
					...connectionPayload,
					created_at: now,
				})
				.select("id, last_synced_at")
				.single();

		if (createConnectionError) {
			throw createConnectionError;
		}

		connectionId = createdConnection.id;
		lastSyncedAt = createdConnection.last_synced_at;
	}

	if (!connectionId) {
		throw new Error("Failed to resolve Mono bank connection id");
	}

	const externalAccountId = account.id ?? account._id ?? accountId;
	const storedAccountType = inferStoredBankAccountType(
		account.type,
		accountMeta?.auth_method
	);
	const bankAccountPayload = {
		team_id: ref.teamId,
		bank_connection_id: connectionId,
		name: account.name ?? institutionName ?? "Connected Account",
		currency: account.currency ?? "NGN",
		type: storedAccountType,
		account_number: account.account_number ?? account.accountNumber ?? null,
		enabled: true,
		manual: false,
		external_id: externalAccountId,
		balance: typeof account.balance === "number" ? account.balance : null,
		available_balance:
			typeof account.balance === "number" ? account.balance : null,
		sync_status:
			detailStatus === "available" || detailStatus === "partial"
				? "available"
				: "pending",
		last_synced_at: lastSyncedAt,
		updated_at: now,
	};

	const { data: existingAccount, error: existingAccountError } = await supabase
		.from("bank_accounts")
		.select("id")
		.eq("team_id", ref.teamId)
		.eq("external_id", externalAccountId)
		.maybeSingle();

	if (existingAccountError) {
		throw existingAccountError;
	}

	if (existingAccount) {
		const { error: updateAccountError } = await supabase
			.from("bank_accounts")
			.update(bankAccountPayload)
			.eq("id", existingAccount.id);

		if (updateAccountError) {
			throw updateAccountError;
		}
	} else {
		const { error: createAccountError } = await supabase
			.from("bank_accounts")
			.insert({
				...bankAccountPayload,
				created_at: now,
			});

		if (createAccountError) {
			throw createAccountError;
		}
	}

	if (
		shouldTriggerInitialMonoSync({
			detailStatus,
			lastSyncedAt,
			retrievedData: accountMeta?.retrieved_data,
		})
	) {
		await tasks.trigger("sync-connection", {
			connectionId,
			manualSync: false,
		});
	}
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

	const accountRecord = asRecord(data.account);
	const meta = asRecord(data.meta);
	const accountId =
		(accountRecord?._id as string | undefined) ??
		(accountRecord?.id as string | undefined) ??
		(data.id as string | undefined);
	if (!accountId) {
		console.warn("[webhook/mono] account_updated missing id");
		return;
	}

	// Midday parity: use Supabase client with service role
	const supabase = createClient();

	// Query bank connection by enrollment_id
	const { data: connectionData, error } = await supabase
		.from("bank_connections")
		.select("id, team_id, status, last_synced_at")
		.eq("enrollment_id", accountId)
		.single();

	if (error || !connectionData) {
		console.warn("[webhook/mono] account_updated: connection not found", {
			accountId,
		});
		return;
	}

	const detailStatus =
		normalizeMonoDetailStatus(meta?.data_status) ?? "processing";
	const retrievedData =
		Array.isArray(meta?.retrieved_data) && meta?.retrieved_data.every((item) => typeof item === "string")
			? (meta.retrieved_data as string[])
			: [];

	const { error: updateConnectionError } = await supabase
		.from("bank_connections")
		.update({
			status: detailStatus === "failed" ? "error" : "connected",
			detail_status: detailStatus,
			institution_name:
				(accountRecord?.institution as Record<string, unknown> | undefined)?.name as
					| string
					| undefined,
			updated_at: new Date().toISOString(),
		})
		.eq("id", connectionData.id);

	if (updateConnectionError) {
		throw updateConnectionError;
	}

	if (
		shouldTriggerInitialMonoSync({
			detailStatus,
			lastSyncedAt: connectionData.last_synced_at,
			retrievedData,
		})
	) {
		await tasks.trigger("sync-connection", {
			connectionId: connectionData.id,
			manualSync: false,
		});
	}

	console.log("[webhook/mono] account_updated: connection updated", {
		connectionId: connectionData.id,
		detailStatus,
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

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}

	return value as Record<string, unknown>;
}

function inferStoredBankAccountType(
	accountType: string | undefined,
	authMethod: string | undefined
): "bank" | "momo" | "cash" | "other" {
	const haystack = `${accountType ?? ""} ${authMethod ?? ""}`.toLowerCase();

	if (haystack.includes("momo") || haystack.includes("mobile_money")) {
		return "momo";
	}

	if (haystack.includes("cash")) {
		return "cash";
	}

	if (haystack.trim().length === 0) {
		return "other";
	}

	return "bank";
}
