const MONO_REF_PREFIX = "faworra";

export type MonoDetailStatus =
	| "available"
	| "failed"
	| "linked"
	| "partial"
	| "processing"
	| "unavailable"
	| "expired";

export const buildMonoRef = (params: {
	teamId: string;
	userId: string;
}) => `${MONO_REF_PREFIX}:${params.teamId}:${params.userId}:${Date.now()}`;

export const parseMonoRef = (
	ref: string | null | undefined
): { teamId: string; userId: string } | null => {
	if (!ref) {
		return null;
	}

	const [prefix, teamId, userId] = ref.split(":");
	if (prefix !== MONO_REF_PREFIX || !teamId || !userId) {
		return null;
	}

	return { teamId, userId };
};

export const normalizeMonoDetailStatus = (
	value: unknown
): MonoDetailStatus | null => {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	const validStatuses = new Set<MonoDetailStatus>([
		"available",
		"failed",
		"linked",
		"partial",
		"processing",
		"unavailable",
		"expired",
	]);

	return validStatuses.has(normalized as MonoDetailStatus)
		? (normalized as MonoDetailStatus)
		: null;
};

export const shouldTriggerInitialMonoSync = (params: {
	detailStatus: MonoDetailStatus | null;
	lastSyncedAt?: string | null;
	retrievedData?: string[] | null;
}) => {
	if (params.lastSyncedAt) {
		return false;
	}

	if (
		params.detailStatus !== "available" &&
		params.detailStatus !== "partial"
	) {
		return false;
	}

	const retrievedData = new Set(
		(params.retrievedData ?? []).map((entry) => entry.toLowerCase())
	);

	return (
		retrievedData.has("transactions") ||
		retrievedData.has("balance") ||
		retrievedData.size === 0
	);
};
