import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { billingValidators } from "./billing-validators";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		// Midday parity: primary pooler URL for job connections
		DATABASE_PRIMARY_POOLER_URL: z.string().min(1).optional(),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		// Billing/Polar is explicitly deferred for this mission.
		// These vars are optional so the API boots without Polar configuration.
		...billingValidators,
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		// Mono banking provider (West Africa)
		// Phase 1: optional for scaffold, required in Phase 2 for real API calls
		MONO_SECRET_KEY: z.string().min(1).optional(),
		MONO_PUBLIC_KEY: z.string().min(1).optional(),
		MONO_WEBHOOK_SECRET: z.string().min(1).optional(),
		// Redis for BullMQ job queues
		// Midday parity: required for job-client package
		REDIS_QUEUE_URL: z.string().min(1).optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
