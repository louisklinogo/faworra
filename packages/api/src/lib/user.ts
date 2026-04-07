import { db } from "@faworra-new/db";
import { userContext } from "@faworra-new/db/schema/core";
import { getDateFormat } from "@faworra-new/location";
import { isValidTimezone } from "@faworra-new/location/timezones";
import { z } from "zod";

export interface RequestLocationContext {
	country: string;
	locale: string;
	timezone: string;
}

const DATE_FORMAT_VALUES = ["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy"] as const;

export const userPreferencesUpdateSchema = z.object({
	dateFormat: z.enum(DATE_FORMAT_VALUES).optional(),
	locale: z.string().trim().min(2).max(35).optional(),
	timeFormat: z.union([z.literal(12), z.literal(24)]).optional(),
	timezone: z
		.string()
		.trim()
		.refine(
			(value) => isValidTimezone(value),
			"Please provide a valid timezone"
		)
		.optional(),
	timezoneAutoSync: z.boolean().optional(),
	weekStartsOnMonday: z.boolean().optional(),
});

type StoredUserPreferences = Pick<
	typeof userContext.$inferSelect,
	| "dateFormat"
	| "locale"
	| "timeFormat"
	| "timezone"
	| "timezoneAutoSync"
	| "weekStartsOnMonday"
>;

export const resolveUserPreferences = (
	stored: StoredUserPreferences | null,
	requestLocation: RequestLocationContext
) => {
	return {
		dateFormat: stored?.dateFormat ?? getDateFormat(requestLocation.country),
		locale: stored?.locale ?? requestLocation.locale,
		timeFormat: stored?.timeFormat ?? 24,
		timezone: stored?.timezone ?? requestLocation.timezone,
		timezoneAutoSync: stored?.timezoneAutoSync ?? true,
		weekStartsOnMonday: stored?.weekStartsOnMonday ?? true,
	};
};

export const getUserPreferences = async (
	userId: string,
	requestLocation: RequestLocationContext
) => {
	const context = await db.query.userContext.findFirst({
		columns: {
			dateFormat: true,
			locale: true,
			timeFormat: true,
			timezone: true,
			timezoneAutoSync: true,
			weekStartsOnMonday: true,
		},
		where: (table, { eq }) => eq(table.userId, userId),
	});

	return resolveUserPreferences(context ?? null, requestLocation);
};

export const updateUserPreferences = async (
	userId: string,
	input: z.infer<typeof userPreferencesUpdateSchema>,
	requestLocation: RequestLocationContext
) => {
	const parsedInput = userPreferencesUpdateSchema.parse(input);

	await db
		.insert(userContext)
		.values({
			userId,
			...parsedInput,
		})
		.onConflictDoUpdate({
			target: userContext.userId,
			set: {
				...parsedInput,
				updatedAt: new Date(),
			},
		});

	return getUserPreferences(userId, requestLocation);
};
