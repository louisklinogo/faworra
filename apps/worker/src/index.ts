import "dotenv/config";
import logger from "./logger";
import { startAccountsPoller, stopAccountsPoller, teardownAllSessions } from "./services/accounts";
import { startOutboxPoller, stopOutboxPoller } from "./services/outbox";
import { startEventOutboxPoller, stopEventOutboxPoller } from "./services/events-outbox";
import { startInstagramRefreshPoller } from "./services/instagram";
import { loadWorkerConfig } from "@Faworra/config";

async function main() {
  logger.info("worker starting");
  startAccountsPoller();
  startOutboxPoller();

  // poll realtime event outbox (optional)
  const cfg = loadWorkerConfig();
  if (cfg.eventOutboxEnabled) {
    startEventOutboxPoller();
  }

  // periodic IG token refresh (every 6 hours)
  startInstagramRefreshPoller();

  // Invoice jobs moved to Trigger.dev (@Faworra/jobs). No scheduling here.
}

main().catch((e) => {
  logger.fatal({ err: e }, "worker failed to start");
  process.exit(1);
});
// invoice jobs moved to ./tasks/invoices/*

function shutdown(signal: string) {
  logger.info({ signal }, "worker shutting down");
  try { stopOutboxPoller(); } catch {}
  try { stopEventOutboxPoller(); } catch {}
  try { stopAccountsPoller(); } catch {}
  teardownAllSessions().finally(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
