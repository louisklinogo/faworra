import { Client as PgClient } from "pg";
import type { EventBus } from "@Faworra/realtime";
import { RTEventSchema, type RTEvent } from "@Faworra/realtime/events";
import logger from "../logger";
import { getRealtimeBus } from "./realtime-bus";
import { loadWorkerConfig } from "@Faworra/config";

async function getRtBus(): Promise<EventBus> { return getRealtimeBus(); }

type PgClientLike = {
  query: <R = any>(text: string, params?: any[]) => Promise<{ rows: R[] }>;
  connect: () => Promise<void>;
  end: () => Promise<void>;
};

export async function processEventOutboxOnce() {
  const connStr = loadWorkerConfig().databaseUrl;
  if (!connStr) {
    logger.warn("EVENT_OUTBOX_ENABLED is on but DATABASE_URL is not set; skipping event outbox");
    return;
  }
  const pg = new PgClient({ connectionString: connStr });
  await pg.connect();
  try {
    const startedAt = Date.now();
    const rows = await claimEventOutbox(pg, 50);
    const claimed = rows.length;
    if (!rows.length) return;
    const bus = await getRtBus();
    let delivered = 0;
    let failed = 0;
    const cfg = loadWorkerConfig();
    for (const row of rows) {
      const attempt = Number(row.retry_count ?? 0) + 1;
      const id = String(row.id);
      const payload: RTEvent = RTEventSchema.parse(row.payload);
      try {
        await bus.publish(payload);
        await pg.query(
          `UPDATE event_outbox
             SET status = 'delivered', delivered_at = now(), last_attempt_at = now(), next_attempt_at = NULL
           WHERE id = $1`,
          [id],
        );
        delivered++;
      } catch (err: unknown) {
        if (attempt >= cfg.eventOutboxMaxRetries) {
          const msg = err instanceof Error ? err.message : String(err);
          await pg.query(
            `UPDATE event_outbox
               SET status = 'dead', retry_count = $2, last_attempt_at = now(), next_attempt_at = NULL, error = $3
             WHERE id = $1`,
            [id, attempt, msg],
          );
          failed++;
        } else {
          const delays = [1_000, 3_000, 10_000, 60_000, 5 * 60_000, 15 * 60_000];
          const delay = delays[Math.min(attempt - 1, delays.length - 1)];
          const msg = err instanceof Error ? err.message : String(err);
          await pg.query(
            `UPDATE event_outbox
               SET status = 'queued', retry_count = $2, last_attempt_at = now(), next_attempt_at = to_timestamp(($3)::double precision/1000.0), error = $4
             WHERE id = $1`,
            [id, attempt, Date.now() + delay, msg],
          );
          failed++;
        }
      }
    }
    const ms = Date.now() - startedAt;
    logger.info({ svc: "event-outbox", claimed, delivered, failed, ms }, "event outbox cycle");
  } finally {
    await pg.end();
  }
}

let eventOutboxTimer: NodeJS.Timeout | null = null;
export function startEventOutboxPoller() {
  if (eventOutboxTimer) return;
  const cfg = loadWorkerConfig();
  eventOutboxTimer = setInterval(() => {
    processEventOutboxOnce().catch((e) => logger.error({ err: e }, "event outbox error"));
  }, Math.max(250, cfg.eventOutboxPollMs));
}
export function stopEventOutboxPoller() {
  if (eventOutboxTimer) {
    clearInterval(eventOutboxTimer);
    eventOutboxTimer = null;
  }
}

async function claimEventOutbox(pg: PgClientLike, limit = 50): Promise<Array<{ id: string; retry_count: number | null; payload: unknown }>> {
  const res = await pg.query<{ id: string; retry_count: number | null; payload: unknown }>(
    `WITH cte AS (
       SELECT id
       FROM event_outbox
       WHERE status = 'queued' AND (next_attempt_at IS NULL OR next_attempt_at <= now())
       ORDER BY next_attempt_at NULLS FIRST, created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT $1
     )
     UPDATE event_outbox e
     SET status = 'processing', last_attempt_at = now()
     FROM cte
     WHERE e.id = cte.id
     RETURNING e.id, e.retry_count, e.payload`,
    [limit],
  );
  return res.rows;
}
