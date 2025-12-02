import { createLogger } from "@Faworra/logging";
const logger = createLogger({ enablePretty: true });

export type PresenceBackend = {
  touch(teamId: string, userId: string): Promise<void>;
  list(teamId: string): Promise<string[]>;
};

class MemoryPresence implements PresenceBackend {
  private map = new Map<string, Map<string, number>>();
  private ttlMs = 20_000; // 20s
  private pruneTimer: any;
  constructor() {
    this.pruneTimer = setInterval(() => this.prune(), 10_000);
  }
  async touch(teamId: string, userId: string) {
    let m = this.map.get(teamId);
    if (!m) { m = new Map(); this.map.set(teamId, m); }
    m.set(userId, Date.now());
  }
  async list(teamId: string) {
    const m = this.map.get(teamId);
    if (!m) return [];
    const now = Date.now();
    return Array.from(m.entries()).filter(([_, ts]) => now - ts <= this.ttlMs).map(([id]) => id);
  }
  private prune() {
    const now = Date.now();
    for (const [teamId, m] of this.map.entries()) {
      for (const [uid, ts] of m.entries()) if (now - ts > this.ttlMs) m.delete(uid);
      if (m.size === 0) this.map.delete(teamId);
    }
  }
}

let backend: PresenceBackend | null = null;

export async function initPresence(): Promise<PresenceBackend> {
  if (backend) return backend;
  const useRedis = process.env.REALTIME_PRESENCE === "redis";
  if (useRedis) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - optional dep typings
      const { createClient } = await import("redis");
      const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
      const client = createClient({ url });
      client.on("error", (e: any) => logger.warn({ msg: "redis presence error", err: String(e?.message || e) }));
      await client.connect();
      logger.info({ msg: "presence: redis backend connected" });
      const TTL_SEC = 20;
      backend = {
        async touch(teamId: string, userId: string) {
          const key = `ONLINE_PRESENCE::${teamId}::USERS`;
          const now = Math.floor(Date.now() / 1000);
          await client.zAdd(key, { score: now, value: userId });
          await client.zRemRangeByScore(key, 0, now - TTL_SEC);
          await client.expire(key, TTL_SEC * 3);
        },
        async list(teamId: string) {
          const key = `ONLINE_PRESENCE::${teamId}::USERS`;
          const now = Math.floor(Date.now() / 1000);
          await client.zRemRangeByScore(key, 0, now - TTL_SEC);
          const ids = await client.zRange(key, 0, -1);
          return ids as string[];
        },
      } as PresenceBackend;
      return backend;
    } catch (e) {
      logger.warn({ msg: "presence: redis not available, falling back to memory", err: String((e as any)?.message || e) });
    }
  }
  backend = new MemoryPresence();
  return backend;
}
