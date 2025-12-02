import type { EventBus } from "../event-bus";
import { RTEventSchema, type RTEvent } from "../events";

export type SocketHttpBusOptions = {
  baseUrl: string; // e.g., http://localhost:3010
  token?: string;  // REALTIME_INTERNAL_TOKEN
  timeoutMs?: number;
};

export function createSocketHttpBus(options: SocketHttpBusOptions): EventBus {
  const { baseUrl, token, timeoutMs = 3000 } = options;
  const endpoint = baseUrl.replace(/\/$/, "") + "/events";
  return {
    async publish(event: RTEvent): Promise<void> {
      // Validate at runtime to prevent malformed broadcasts
      const parsed = RTEventSchema.parse(event);
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(parsed),
          signal: controller.signal,
        }).then(async (res) => {
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`socket-http bus ${res.status}: ${txt}`);
          }
        });
      } finally {
        clearTimeout(id);
      }
    },
  };
}
