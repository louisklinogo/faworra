import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useTransactionParams() {
	const [params, setParams] = useQueryStates({
		transactionId: parseAsString,
		createTransaction: parseAsBoolean,
		editTransaction: parseAsString,
	});

	return {
		...params,
		setParams,
	};
}
