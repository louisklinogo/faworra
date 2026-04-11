/**
 * Trigger.dev job payload schemas
 * Midday parity: Zod schemas for all job types
 *
 * Reference: midday-wiki/content/Shared Packages/Job Scheduling (@midday_jobs).md
 * Each job payload is defined with Zod for strict typing and validation
 */

import { z } from "zod";

// ─── Banking Sync Jobs ────────────────────────────────────────────────────────

/** Sync a bank connection and all its accounts - Midday parity */
export const syncConnectionSchema = z.object({
	connectionId: z.string(),
	manualSync: z.boolean().optional(),
});

/** Sync a single bank account - Midday parity */
export const syncAccountSchema = z.object({
	id: z.string().uuid(), // bank_accounts.id
	teamId: z.string().uuid(),
	accountId: z.string(), // provider account_id
	accessToken: z.string().optional(),
	provider: z.enum(["mono"]),
	connectionId: z.string().uuid(),
	accountType: z.enum([
		"bank",
		"momo",
		"cash",
		"other",
	]),
	currency: z.string().optional(),
	manualSync: z.boolean().optional(),
});

/** Initial bank setup for a team - Midday parity */
export const initialBankSetupSchema = z.object({
	teamId: z.string().uuid(),
	connectionId: z.string().uuid(),
});

/** Process Mono webhook event */
export const processMonoWebhookSchema = z.object({
	event: z.string(), // e.g., 'mono.events.account_connected'
	data: z.record(z.string(), z.unknown()),
});

// ─── Document Processing Jobs ─────────────────────────────────────────────────

/** Process uploaded document */
export const processDocumentSchema = z.object({
	documentId: z.string(),
	teamId: z.string(),
	filePath: z.string().optional(),
});

// ─── Scheduled Jobs ────────────────────────────────────────────────────────────

/** Daily sync job payload */
export const dailySyncSchema = z.object({
	teamId: z.string().optional(), // If omitted, sync all teams
});

/** Weekly summary job payload */
export const weeklySummarySchema = z.object({
	teamId: z.string(),
});

// ─── Invoice Jobs (Future) ─────────────────────────────────────────────────────

/** Invoice reminder sequence */
export const invoiceReminderSchema = z.object({
	invoiceId: z.string(),
	teamId: z.string(),
	customerId: z.string(),
	dueDate: z.string(),
	attempt: z.number().default(1),
});

/** Invoice generation */
export const invoiceGenerationSchema = z.object({
	invoiceId: z.string(),
	teamId: z.string(),
	scheduled: z.boolean().default(false),
});

// ─── Notification Jobs (Future) ────────────────────────────────────────────────

/** Notification event payload - discriminated union pattern from Midday */
export const notificationEventSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("transaction.created"),
		transactionId: z.string(),
		teamId: z.string(),
	}),
	z.object({
		type: z.literal("invoice.sent"),
		invoiceId: z.string(),
		teamId: z.string(),
	}),
	z.object({
		type: z.literal("document.processed"),
		documentId: z.string(),
		teamId: z.string(),
	}),
	z.object({
		type: z.literal("bank.connected"),
		connectionId: z.string(),
		teamId: z.string(),
	}),
	z.object({
		type: z.literal("bank.disconnected"),
		connectionId: z.string(),
		teamId: z.string(),
	}),
]);

// ─── Export Types ──────────────────────────────────────────────────────────────

export type SyncConnectionPayload = z.infer<typeof syncConnectionSchema>;
export type SyncAccountPayload = z.infer<typeof syncAccountSchema>;
export type InitialBankSetupPayload = z.infer<typeof initialBankSetupSchema>;
export type ProcessMonoWebhookPayload = z.infer<
	typeof processMonoWebhookSchema
>;
export type ProcessDocumentPayload = z.infer<typeof processDocumentSchema>;
export type DailySyncPayload = z.infer<typeof dailySyncSchema>;
export type WeeklySummaryPayload = z.infer<typeof weeklySummarySchema>;
export type InvoiceReminderPayload = z.infer<typeof invoiceReminderSchema>;
export type InvoiceGenerationPayload = z.infer<typeof invoiceGenerationSchema>;
export type NotificationEventPayload = z.infer<typeof notificationEventSchema>;

// ─── All Schemas Map ────────────────────────────────────────────────────────────

export const schemas = {
	syncConnection: syncConnectionSchema,
	syncAccount: syncAccountSchema,
	initialBankSetup: initialBankSetupSchema,
	processMonoWebhook: processMonoWebhookSchema,
	processDocument: processDocumentSchema,
	dailySync: dailySyncSchema,
	weeklySummary: weeklySummarySchema,
	invoiceReminder: invoiceReminderSchema,
	invoiceGeneration: invoiceGenerationSchema,
	notificationEvent: notificationEventSchema,
};
