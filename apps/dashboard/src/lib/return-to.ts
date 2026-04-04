export const DEFAULT_RETURN_TO = "/dashboard";

export const getSafeReturnTo = (returnTo?: string): string => {
	if (!returnTo) {
		return DEFAULT_RETURN_TO;
	}

	// Decode percent-encoded characters before checking so that encoded attack
	// sequences like /%5C (backslash) or /%2F (slash) cannot bypass the
	// path checks even when the caller has not pre-decoded the value.
	let decoded: string;
	try {
		decoded = decodeURIComponent(returnTo);
	} catch {
		// Malformed percent-encoding — fall back to the safe default.
		return DEFAULT_RETURN_TO;
	}

	// Must start with a single "/" (not a protocol like "https://", not a
	// protocol-relative "//", and not a slash-backslash "/\" which some
	// browsers normalise to a protocol-relative URL).
	if (!decoded.startsWith("/")) {
		return DEFAULT_RETURN_TO;
	}

	const secondChar = decoded[1];
	if (secondChar === "/" || secondChar === "\\") {
		return DEFAULT_RETURN_TO;
	}

	return decoded;
};
