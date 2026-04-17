/**
 * BullMQ Job Client API
 * Midday parity: provides triggerJob, triggerJobAndWait, getJobStatus
 *
 * Reference: .references/midday-wiki/content/Advanced Topics/Background Jobs & Queue Processing.md
 *
 * This is the client library for enqueueing jobs with BullMQ.
 * The actual job processors run in apps/worker.
 */

import { z } from "zod";
import {
	createCompositeJobId,
	DEFAULT_JOB_OPTIONS,
	getQueue,
	parseCompositeJobId,
	QUEUE_NAMES,
	type QueueName,
} from "./queues";

// ─── Job Status Schema ────────────────────────────────────────────────────────

export const jobStatusResponseSchema = z.object({
	id: z.string(),
	status: z.enum([
		"waiting",
		"active",
		"completed",
		"failed",
		"delayed",
		"prioritized",
		"unknown",
	]),
	progress: z.number().optional(),
	result: z.unknown().optional(),
	error: z.string().optional(),
	data: z.record(z.string(), z.unknown()).optional(),
});

export type JobStatusResponse = z.infer<typeof jobStatusResponseSchema>;

// ─── Trigger Job ──────────────────────────────────────────────────────────────

export interface TriggerJobOptions {
	delay?: number; // Delay in milliseconds
	jobId?: string; // For deduplication
	priority?: number;
	queueName?: QueueName;
}

/**
 * Trigger a background job with BullMQ
 *
 * @param name - Job name (must match processor in apps/worker)
 * @param payload - Job payload (validated by worker)
 * @param options - Queue and job options
 * @returns Composite job ID for tracking
 */
export async function triggerJob(
	name: string,
	payload: Record<string, unknown>,
	options: TriggerJobOptions = {}
): Promise<{ id: string }> {
	const queueName = options.queueName ?? QUEUE_NAMES.BANK_SYNC;
	const queue = getQueue(queueName);

	// Create composite job ID for deduplication
	const jobId =
		options.jobId ?? createCompositeJobId(queueName, name, crypto.randomUUID());

	const job = await queue.add(name, payload, {
		jobId,
		delay: options.delay,
		priority: options.priority,
		...DEFAULT_JOB_OPTIONS,
	});

	console.log(`[job-client] Triggered job: ${name}`, {
		queueName,
		jobId: job.id,
		delay: options.delay,
	});

	return { id: jobId };
}

// ─── Trigger Job and Wait ─────────────────────────────────────────────────────

export interface TriggerJobAndWaitOptions extends TriggerJobOptions {
	pollInterval?: number; // Ms between polls
	timeout?: number; // Maximum wait time in ms (default: 30 seconds)
}

/**
 * Trigger a job and wait for completion with polling
 * Midday pattern: exponential backoff polling, avoids blocking workers
 *
 * @param name - Job name
 * @param payload - Job payload
 * @param options - Queue and wait options
 * @returns Job result or throws on failure/timeout
 */
export async function triggerJobAndWait<T = unknown>(
	name: string,
	payload: Record<string, unknown>,
	options: TriggerJobAndWaitOptions = {}
): Promise<{ id: string; result?: T }> {
	const { id } = await triggerJob(name, payload, options);

	const queueName = options.queueName ?? QUEUE_NAMES.BANK_SYNC;
	const queue = getQueue(queueName);

	// Polling configuration
	const timeout = options.timeout ?? 30_000;
	const initialPollInterval = options.pollInterval ?? 100;
	const maxPollInterval = 5000;

	const startTime = Date.now();
	let pollInterval = initialPollInterval;

	while (Date.now() - startTime < timeout) {
		const parsed = parseCompositeJobId(id);
		if (!parsed) {
			throw new Error(`[job-client] Invalid composite job ID: ${id}`);
		}

		const job = await queue.getJob(id);

		if (!job) {
			throw new Error(`[job-client] Job not found: ${id}`);
		}

		const state = await job.getState();

		if (state === "completed") {
			console.log(`[job-client] Job completed: ${id}`);
			return { id, result: job.returnvalue as T };
		}

		if (state === "failed") {
			const error = job.failedReason ?? "Job failed";
			console.error(`[job-client] Job failed: ${id}`, error);
			throw new Error(error);
		}

		// Wait before next poll (exponential backoff)
		await sleep(pollInterval);
		pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
	}

	throw new Error(`[job-client] Job timed out after ${timeout}ms: ${id}`);
}

// ─── Get Job Status ────────────────────────────────────────────────────────────

export interface GetJobStatusOptions {
	queueName?: QueueName;
	validateTeamId?: string; // Team ID for authorization check
}

/**
 * Get the status of a job by composite ID
 * Midday pattern: validates team ownership for authorization
 *
 * @param compositeId - Composite job ID (from triggerJob)
 * @param options - Options including authorization
 * @returns Job status response
 */
export async function getJobStatus(
	compositeId: string,
	options: GetJobStatusOptions = {}
): Promise<JobStatusResponse> {
	const parsed = parseCompositeJobId(compositeId);
	if (!parsed) {
		throw new Error(`[job-client] Invalid composite job ID: ${compositeId}`);
	}

	const { queueName } = parsed;
	const queue = getQueue(queueName);
	const job = await queue.getJob(compositeId);

	if (!job) {
		return {
			id: compositeId,
			status: "failed",
			error: "Job not found",
		};
	}

	// Team authorization check (if team ID in payload)
	if (
		options.validateTeamId &&
		job.data?.teamId &&
		job.data.teamId !== options.validateTeamId
	) {
		throw new Error("[job-client] Unauthorized: team ID mismatch");
	}

	const state = await job.getState();

	// Convert JobProgress to number if needed
	const progress =
		typeof job.progress === "number"
			? job.progress
			: typeof job.progress === "string"
				? Number.parseFloat(job.progress)
				: undefined;

	// Cast state to match our schema (BullMQ returns "unknown" for unrecognized states)
	const status = state as z.infer<typeof jobStatusResponseSchema>["status"];

	return {
		id: compositeId,
		status,
		progress,
		result: job.returnvalue,
		error: job.failedReason,
		data: job.data as Record<string, unknown>,
	};
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Re-exports ──────────────────────────────────────────────────────────────

export { QUEUE_NAMES, type QueueName } from "./queues";
