import { createLogger } from "@Faworra/logging";
import path from "node:path";

const sessionStamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");
const logFile = path.join(process.cwd(), "logs", `worker-${sessionStamp}.log`);
const isProd = process.env.NODE_ENV === "production";

const transport = {
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
          },
        ]
      : []),
    {
      target: "pino/file",
      options: {
        destination: logFile,
        mkdir: true,
      },
    },
  ],
} as const;

export const logger = createLogger({
  name: "worker",
  transport,
});

export default logger;
