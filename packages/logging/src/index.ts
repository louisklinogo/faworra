import pino, { type Logger, type LoggerOptions } from "pino";

const DEFAULT_REDACT_PATHS = [
  "req.headers.authorization",
  "headers.authorization",
  "Authorization",
  "authorization",
  "SUPABASE_*",
  "supabase*",
];

const isProd = process.env.NODE_ENV === "production";
const defaultLevel = process.env.LOG_LEVEL ?? (isProd ? "info" : "debug");

export type SharedLoggerOptions = LoggerOptions & {
  enablePretty?: boolean;
};

export function createLogger(options?: SharedLoggerOptions): Logger {
  const {
    enablePretty,
    transport: providedTransport,
    level: providedLevel,
    redact: providedRedact,
    ...rest
  } = options ?? {};

  const level = providedLevel ?? defaultLevel;
  const redact = providedRedact ?? {
    paths: DEFAULT_REDACT_PATHS,
    remove: true,
  };

  let transport = providedTransport;
  if (transport === undefined) {
    const shouldPretty = enablePretty ?? !isProd;
    if (shouldPretty) {
      transport = {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          singleLine: false,
        },
      } as LoggerOptions["transport"];
    }
  }

  return pino({
    level,
    redact,
    transport,
    ...rest,
  });
}

export type { Logger };
export default createLogger;
