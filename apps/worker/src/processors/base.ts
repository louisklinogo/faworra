/**
 * Base processor class for BullMQ jobs
 * Midday parity: error handling, logging, idempotency
 *
 * Reference: midday/apps/worker/src/processors/base.ts
 */

import type { Job } from "bullmq";

/**
 * Base processor class with error handling and logging
 */
export abstract class BaseProcessor<TData = unknown> {
	protected logger = console;

	constructor(protected name: string) {
		this.logger = {
			...console,
			info: (...args) => console.log(`[${name}]`, ...args),
			error: (...args) => console.error(`[${name}]`, ...args),
			warn: (...args) => console.warn(`[${name}]`, ...args),
		};
	}

	/**
	 * Process the job - override in subclasses
	 */
	abstract process(job: Job<TData>): Promise<unknown>;

	/**
	 * Main handler called by BullMQ worker
	 */
	async handle(job: Job<TData>): Promise<unknown> {
		const startTime = Date.now();

		this.logger.info("Processing job", {
			jobId: job.id,
			jobName: job.name,
			attempt: job.attemptsMade + 1,
			maxAttempts: job.opts.attempts,
		});

		try {
			const result = await this.process(job);
			const duration = Date.now() - startTime;

			this.logger.info("Job completed", {
				jobId: job.id,
				jobName: job.name,
				duration: `${duration}ms`,
			});

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			this.logger.error("Job failed", {
				jobId: job.id,
				jobName: job.name,
				attempt: job.attemptsMade + 1,
				duration: `${duration}ms`,
				error: errorMessage,
			});

			throw error;
		}
	}
}
