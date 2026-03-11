export const DEFAULT_RETURN_TO = "/dashboard";

export const getSafeReturnTo = (returnTo?: string): string => {
	if (!returnTo) {
		return DEFAULT_RETURN_TO;
	}

	return returnTo.startsWith("/") && !returnTo.startsWith("//")
		? returnTo
		: DEFAULT_RETURN_TO;
};
