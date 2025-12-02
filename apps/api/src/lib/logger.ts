import { createLogger } from "@Faworra/logging";

const logger = createLogger({ name: "api" });

export type Logger = typeof logger;
export default logger;
