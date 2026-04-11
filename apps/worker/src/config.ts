/**
 * Worker configuration
 * Midday parity: Redis connection options for BullMQ workers
 */

import { env } from "@faworra-new/env/server";
import { QUEUE_NAMES } from "@faworra-new/job-client";

// Re-export QUEUE_NAMES for use in worker
export { QUEUE_NAMES };

// ─── Redis Connection Config ────────────────────────────────────────────────

export interface RedisConfig {
	enableReadyCheck: boolean;
	host: string;
	maxRetriesPerRequest: number | null;
	password?: string;
	port: number;
	tls?: { [key: string]: unknown };
}

/**
 * Get Redis connection config for workers
 * Different from job-client queues - workers need different pool settings
 */
export function getWorkerRedisConfig(): RedisConfig {
	if (!env.REDIS_QUEUE_URL) {
		console.warn("[worker] REDIS_QUEUE_URL not set, using localhost");
		return {
			host: "localhost",
			port: 6379,
			maxRetriesPerRequest: null,
			enableReadyCheck: false,
		};
	}

	const url = new URL(env.REDIS_QUEUE_URL);

	return {
		host: url.hostname,
		port: Number(url.port) || 6379,
		password: url.password || undefined,
		tls: url.protocol === "rediss:" ? {} : undefined,
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
	};
}

// ─── Worker Defaults ────────────────────────────────────────────────────────

/**
 * Default job options for workers
 * Midday parity: 3 attempts with exponential backoff
 */
export const DEFAULT_JOB_OPTIONS = {
	attempts: 3,
	backoff: {
		type: "exponential" as const,
		delay: 1000,
	},
	removeOnComplete: {
		age: 24 * 3600,
		count: 1000,
	},
	removeOnFail: {
		age: 7 * 24 * 3600,
	},
} as const;

// ─── Queue Configurations ────────────────────────────────────────────────────

/**
 * Queue configuration for worker
 * Maps queue names to their processor registry
 */
export interface QueueConfig {
	name: string;
	/** Job name -> processor function map */
	processors: Record<string, ProcessorFunction>;
}

export type ProcessorFunction = (job: {
	id: string;
	name: string;
	data: unknown;
}) => Promise<unknown>;

// ─── Health Check Config ─────────────────────────────────────────────────────

export const HEALTH_CHECK_INTERVAL_MS = 10_000;
export const POOL_STATS_INTERVAL_MS = 60_000;
export const SHUTDOWN_TIMEOUT_MS = 30_000;
