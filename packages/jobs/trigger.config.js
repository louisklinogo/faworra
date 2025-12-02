// Load .env for local dev so TRIGGER_PROJECT_ID is available
import "dotenv/config";
import { defineConfig } from "@trigger.dev/sdk";
export default defineConfig({
    project: process.env.TRIGGER_PROJECT_ID,
    runtime: "node",
    logLevel: "log",
    maxDuration: 60,
    experimental_processKeepAlive: true,
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
    build: {
        external: ["sharp", "canvas", "pino", "import-in-the-middle"],
    },
    dirs: ["./src/tasks"],
});
