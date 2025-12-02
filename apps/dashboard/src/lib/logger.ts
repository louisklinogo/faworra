import "server-only";

import path from "node:path";
import { createLogger } from "@Faworra/logging";
import type { LoggerOptions } from "pino";

const sessionStamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");
const logFile = path.join(process.cwd(), "logs", `admin-${sessionStamp}.log`);
const isProd = process.env.NODE_ENV === "production";

const targets: LoggerOptions["transport"] = {
  targets: [
    ...(!isProd
      ? [
          {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              singleLine: false,
            },
          } as const,
        ]
      : []),
    {
      target: "pino/file",
      options: {
        destination: logFile,
        mkdir: true,
      },
    } as const,
  ],
};

export const logger = createLogger({
  name: "admin",
  transport: targets,
});

export default logger;
