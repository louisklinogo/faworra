import { z } from "zod";

/**
 * Optional Zod validators for Polar billing environment variables.
 *
 * Exported separately from the env module so callers can verify the schema
 * shape in tests without triggering process.env validation at module load time.
 *
 * Billing/Polar is explicitly deferred for this mission. These validators are
 * optional so the API and dashboard can boot without Polar configuration.
 */
export const billingValidators = {
	POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
	POLAR_PRO_PRODUCT_ID: z.string().min(1).optional(),
	POLAR_SUCCESS_URL: z.url().optional(),
} as const;
