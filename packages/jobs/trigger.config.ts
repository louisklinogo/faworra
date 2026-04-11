/**
 * Trigger.dev configuration
 * Midday parity: COPY from midday/packages/jobs/trigger.config.ts
 *
 * Changes: runtime "bun" instead of "node" (Faworra uses Bun)
 *
 * Load `.env` before `defineConfig` runs. The `trigger dev` CLI reads `.env` for its
 * own merged env object but does not populate `process.env` before Jiti evaluates
 * this file, so `process.env.TRIGGER_PROJECT_ID` would otherwise be undefined
 * ("Project not found: undefined").
 */

import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@trigger.dev/sdk";

const configDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(configDir, ".env"), quiet: true });

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID!,
  runtime: "bun", // Midday uses "node", Faworra uses "bun"
  logLevel: "log",
  maxDuration: 60,
  // Disabled for development testing
  // experimental_processKeepAlive: true,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/tasks"],
});
