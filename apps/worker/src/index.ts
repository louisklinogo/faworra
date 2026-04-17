/**
 * Worker Runtime - BullMQ Job Processor
 * Midday parity: registry-driven processor model
 *
 * Reference: .references/midday-wiki/content/Core Applications/Worker Application/Worker Application.md
 */

import { db } from "@faworra-new/db";
import type { Job } from "bullmq";
import { Worker as BullMQWorker } from "bullmq";
import { Hono } from "hono";
import {
	getWorkerRedisConfig,
	type ProcessorFunction,
	QUEUE_NAMES,
} from "./config";

// ─── Processor Registry ───────────────────────────────────────────────────────

/**
 * Global processor registry
 * Maps job names to processor functions
 */
const processorRegistry = new Map<string, ProcessorFunction>();

/**
 * Register a processor for a job name
 */
export function registerProcessor(
	jobName: string,
	processor: ProcessorFunction
) {
	processorRegistry.set(jobName, processor);
	console.log(`[worker] Registered processor for: ${jobName}`);
}

/**
 * Get processor for a job name
 */
export function getProcessor(jobName: string): ProcessorFunction | undefined {
	return processorRegistry.get(jobName);
}

// ─── Default Processors (Phase 1 Stubs) ──────────────────────────────────────────

/**
 * Default processor that logs and returns pending status
 * Used for Phase 1 until real processors are implemented
 */
const stubProcessor: ProcessorFunction = async (job) => {
	console.log(`[worker] Processing job: ${job.name}`, {
		id: job.id,
		data: job.data,
	});
	return {
		status: "pending",
		message: "Phase 1 stub - processor not implemented",
	};
};

// Register stub processors for known job types
registerProcessor("sync-bank-transactions", stubProcessor);
registerProcessor("sync-account-balances", stubProcessor);
registerProcessor("data-available-event", stubProcessor);

// ─── Worker Initialization ─────────────────────────────────────────────────────

const workers: BullMQWorker[] = [];

/**
 * Create a worker for a queue
 */
function createWorker(queueName: string): BullMQWorker {
	const connection = getWorkerRedisConfig();

	console.log(`[worker] Creating worker for queue: ${queueName}`);

	const worker = new BullMQWorker(
		queueName,
		async (job: Job) => {
			const processor = getProcessor(job.name);

			if (!processor) {
				console.error(`[worker] No processor for job: ${job.name}`);
				throw new Error(`No processor registered for: ${job.name}`);
			}

			console.log(`[worker] Executing: ${job.name}`, {
				id: job.id,
				attemptsMade: job.attemptsMade,
				data: job.data,
			});

			const jobId = job.id ?? `unknown-${Date.now()}`;
			return processor({ id: jobId, name: job.name, data: job.data });
		},
		{
			connection,
			autorun: true,
		}
	);

	// Event handlers
	worker.on("completed", (job: Job, result: unknown) => {
		console.log(`[worker] Job completed: ${job.name}`, { id: job.id, result });
	});

	worker.on("failed", (job: Job | undefined, err: Error) => {
		console.error("[worker] Job failed:", {
			name: job?.name,
			id: job?.id,
			attemptsMade: job?.attemptsMade,
			error: err.message,
		});
	});

	worker.on("error", (err: Error) => {
		console.error("[worker] Worker error:", err);
	});

	return worker;
}

// ─── Health HTTP Server ─────────────────────────────────────────────────────────

const healthApp = new Hono();

healthApp.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

healthApp.get("/ready", async (c) => {
	// Check database connection
	try {
		await db.execute("SELECT 1");
		return c.json({ status: "ready", database: "connected" });
	} catch (err) {
		return c.json({ status: "not ready", database: "error" }, 503);
	}
});

healthApp.get("/info", (c) => {
	return c.json({
		workers: workers.length,
		processors: Array.from(processorRegistry.keys()),
		queues: Object.values(QUEUE_NAMES),
	});
});

// ─── Lifecycle Management ───────────────────────────────────────────────────────

let isShuttingDown = false;

async function gracefulShutdown() {
	if (isShuttingDown) {
		return;
	}
	isShuttingDown = true;

	console.log("[worker] Initiating graceful shutdown...");

	// Close workers
	await Promise.all(
		workers.map(async (worker) => {
			console.log(`[worker] Closing worker: ${worker.name}`);
			await worker.close();
		})
	);

	console.log("[worker] All workers closed");
	process.exit(0);
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// ─── Main Entry Point ───────────────────────────────────────────────────────────

async function main() {
	console.log("[worker] Starting Faworra Worker...");

	// Create workers for each queue
	const queues = [QUEUE_NAMES.BANK_SYNC, QUEUE_NAMES.DOCUMENTS];

	for (const queueName of queues) {
		const worker = createWorker(queueName);
		workers.push(worker);
	}

	console.log(`[worker] ${workers.length} workers initialized`);

	// Start health check server
	const port = Number(process.env.WORKER_PORT) || 3002;
	console.log(`[worker] Health server listening on port ${port}`);

	Bun.serve({
		port,
		fetch: healthApp.fetch,
	});

	console.log("[worker] Ready to process jobs");
}

main().catch((err) => {
	console.error("[worker] Fatal error:", err);
	process.exit(1);
});
