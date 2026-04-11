/**
 * BullMQ Queue Configuration
 * Midday parity: centralized queue creation with Redis connection handling
 *
 * Reference: midday-wiki/content/Advanced Topics/Background Jobs & Queue Processing.md
 */

import { env } from "@faworra-new/env/server";
import { type ConnectionOptions, Queue } from "bullmq";

// ─── Redis Connection Options ────────────────────────────────────────────────

/**
 * Parse Redis URL and create connection options
 * Midday pattern: protocol-aware TLS handling
 */
function parseRedisUrl(url: string): ConnectionOptions {
	const parsed = new URL(url);

	return {
		host: parsed.hostname,
		port: Number(parsed.port) || 6379,
		password: parsed.password || undefined,
		// Enable TLS for rediss:// URLs
		tls: parsed.protocol === "rediss:" ? {} : undefined,
		// Connection tuning for production
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
	};
}

/**
 * Get Redis connection options
 * Falls back to localhost Redis if REDIS_QUEUE_URL not set
 */
export function getRedisConnection(): ConnectionOptions {
	if (env.REDIS_QUEUE_URL) {
		return parseRedisUrl(env.REDIS_QUEUE_URL);
	}

	// Development fallback
	console.warn("[job-client] REDIS_QUEUE_URL not set, using localhost Redis");
	return {
		host: "localhost",
		port: 6379,
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
	};
}

// ─── Queue Creation ──────────────────────────────────────────────────────────

// Cache of created queues to reuse connections
const queueCache = new Map<string, Queue>();

/**
 * Default job options
 * Midday parity: 3 attempts with exponential backoff
 */
export const DEFAULT_JOB_OPTIONS = {
	attempts: 3,
	backoff: {
		type: "exponential" as const,
		delay: 1000, // Start with 1 second
	},
	// Retention policies
	removeOnComplete: {
		age: 24 * 3600, // 24 hours
		count: 1000, // Or 1000 jobs max
	},
	removeOnFail: {
		age: 7 * 24 * 3600, // 7 days
	},
} as const;

/**
 * Create or get a BullMQ queue
 * Uses caching to avoid creating duplicate queues
 */
export function getQueue(name: string): Queue {
	if (queueCache.has(name)) {
		return queueCache.get(name)!;
	}

	const connection = getRedisConnection();

	const queue = new Queue(name, {
		connection,
		defaultJobOptions: DEFAULT_JOB_OPTIONS,
	});

	// Global error listener to prevent unhandled exceptions
	queue.on("error", (err) => {
		console.error(`[job-client] Queue ${name} error:`, err);
	});

	queueCache.set(name, queue);
	return queue;
}

// ─── Composite Job ID Helpers ────────────────────────────────────────────────

/**
 * Create a composite job ID for deduplication
 * Midday pattern: `{queueName}:{jobName}:{uniqueId}`
 */
export function createCompositeJobId(
	queueName: string,
	jobName: string,
	uniqueId: string
): string {
	return `${queueName}:${jobName}:${uniqueId}`;
}

/**
 * Parse a composite job ID into components
 */
export function parseCompositeJobId(compositeId: string): {
	queueName: string;
	jobName: string;
	uniqueId: string;
} | null {
	const parts = compositeId.split(":");
	if (parts.length !== 3) {
		console.error(`[job-client] Invalid composite job ID: ${compositeId}`);
		return null;
	}

	const [queueName, jobName, uniqueId] = parts;

	// We know these are defined due to the length check, but TypeScript doesn't
	return {
		queueName: queueName ?? "",
		jobName: jobName ?? "",
		uniqueId: uniqueId ?? "",
	};
}

// ─── Queue Names ────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
	// Banking operations
	BANK_SYNC: "bank-sync",
	DATA_AVAILABLE: "data-available",

	// Document processing
	DOCUMENTS: "documents",

	// Notifications
	NOTIFICATIONS: "notifications",

	// Scheduled jobs
	SCHEDULED: "scheduled-jobs",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
