import { createLogger } from "@Faworra/logging";
const logger = createLogger({ enablePretty: true });

export interface LockManager {
  acquire(key: string, ttlMs?: number): Promise<boolean>;
  release(key: string): Promise<void>;
  withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null>;
}

class MemoryLockManager implements LockManager {
  private locks = new Map<string, number>();
  async acquire(key: string, ttlMs: number = 10_000): Promise<boolean> {
    const now = Date.now();
    const exp = this.locks.get(key) || 0;
    if (exp > now) return false;
    this.locks.set(key, now + ttlMs);
    return true;
  }
  async release(key: string): Promise<void> {
    this.locks.delete(key);
  }
  async withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
    if (!(await this.acquire(key, ttlMs))) return null;
    try { return await fn(); } finally { await this.release(key); }
  }
}

let instance: LockManager | null = null;

export async function getLockManager(): Promise<LockManager> {
  if (instance) return instance;
  if (process.env.REDIS_URL) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore optional dep
      const { createClient } = await import("redis");
      const client = createClient({ url: process.env.REDIS_URL });
      client.on("error", (e: any) => logger.warn({ msg: "redis lock error", err: String(e?.message || e) }));
      await client.connect();
      instance = {
        async acquire(key: string, ttlMs: number = 10_000) {
          const ok = await client.set(`lock:${key}`, "1", { NX: true, PX: ttlMs });
          return ok === "OK";
        },
        async release(key: string) {
          try { await client.del(`lock:${key}`); } catch {}
        },
        async withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
          const got = await this.acquire(key, ttlMs);
          if (!got) return null;
          try { return await fn(); } finally { await this.release(key); }
        },
      };
      return instance;
    } catch (e) {
      logger.warn({ msg: "redis not available for locks, using memory" });
    }
  }
  instance = new MemoryLockManager();
  return instance;
}
