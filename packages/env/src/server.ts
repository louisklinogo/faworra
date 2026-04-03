import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { billingValidators } from "./billing-validators";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		// Billing/Polar is explicitly deferred for this mission.
		// These vars are optional so the API boots without Polar configuration.
		...billingValidators,
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
