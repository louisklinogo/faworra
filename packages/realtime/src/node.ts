import type { EventBus } from "./event-bus";
import { createMultiBus } from "./adapters/multi";
import { createSocketHttpBus } from "./adapters/socketio-http";
import { createSupabaseBus } from "./adapters/supabase";

export type CreateNodeEventBusOptions = {
  supabase?: import("@supabase/supabase-js").SupabaseClient;
  baseUrl?: string; // override REALTIME_URL
  token?: string;   // override REALTIME_INTERNAL_TOKEN
  preferSocket?: boolean; // override REALTIME_TRANSPORT/REALTIME_DUAL
  enableDual?: boolean;   // send to both
};

/**
 * Build an EventBus for Node runtimes, combining transports per env.
 * - If a Supabase client is provided, include Supabase broadcast bus.
 * - If REALTIME_URL (+ optional token) or options.baseUrl provided, include Socket.IO HTTP bus.
 * - If both present, returns a MultiBus that fan-outs.
 */
export function createNodeEventBus(options?: CreateNodeEventBusOptions): EventBus {
  const buses: EventBus[] = [];
  const baseUrl = options?.baseUrl ?? process.env.REALTIME_URL;
  const token = options?.token ?? process.env.REALTIME_INTERNAL_TOKEN;
  const preferSocket = options?.preferSocket ?? (process.env.REALTIME_TRANSPORT === "socketio");
  const enableDual = options?.enableDual ?? (process.env.REALTIME_DUAL === "1");

  if (options?.supabase) {
    try { buses.push(createSupabaseBus(options.supabase)); } catch {}
  }
  if (baseUrl) {
    try { buses.push(createSocketHttpBus({ baseUrl, token })); } catch {}
  }

  if (buses.length === 0) {
    // No transports configured; provide a no-op bus to avoid runtime errors.
    return { async publish() { /* noop */ } } as EventBus;
  }

  if (buses.length === 1) return buses[0];

  // If not dual, but socket preferred and present, place socket first (ordering doesn't matter for MultiBus, kept for clarity)
  if (!enableDual && preferSocket && baseUrl) {
    // still MultiBus, but consumers can later evolve to single preferred path if needed
  }
  return createMultiBus(buses);
}
