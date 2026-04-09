export type ReviewableTransactionStatus = "excluded" | "pending" | "posted" | "completed" | "archived" | "exported";

export const isValidTransactionReviewTransition = ({
	from,
	to,
}: {
	from: ReviewableTransactionStatus;
	to: "excluded" | "posted";
}) => {
	// From pending, can go to excluded or posted
	if (from === "pending" && (to === "excluded" || to === "posted")) {
		return true;
	}

	// From excluded, can go to posted
	if (from === "excluded" && to === "posted") {
		return true;
	}

	// From posted, can go to excluded
	if (from === "posted" && to === "excluded") {
		return true;
	}

	// completed/archived/exported cannot transition via review
	return false;
};
