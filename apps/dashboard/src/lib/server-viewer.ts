import { createServerTrpcClient } from "./server-trpc";

export const getServerViewer = async () => {
	const trpcClient = await createServerTrpcClient();
	return trpcClient.viewer.query();
};
