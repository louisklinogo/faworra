import logger from "../../logger";

/**
 * DEPRECATED: Invoice cron logic moved to Trigger.dev (@Faworra/jobs).
 * This function is kept as a no-op to avoid accidental usage.
 */
export async function processOverdueMarkers() {
  logger.info("processOverdueMarkers is deprecated; handled by Trigger.dev");
}
