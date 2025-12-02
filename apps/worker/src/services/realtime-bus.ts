import { createServerClient } from "@Faworra/supabase/server";
import { createNodeEventBus } from "@Faworra/realtime";
import type { EventBus } from "@Faworra/realtime";
import { loadWorkerConfig } from "@Faworra/config";

let _busPromise: Promise<EventBus> | null = null;
export async function getRealtimeBus(): Promise<EventBus> {
  if (_busPromise) return _busPromise;
  _busPromise = (async () => {
    let supabase: import("@supabase/supabase-js").SupabaseClient | undefined;
    try { supabase = (await createServerClient({ admin: true })) as unknown as import("@supabase/supabase-js").SupabaseClient; } catch {}
    const cfg = loadWorkerConfig();
    return createNodeEventBus({ supabase, baseUrl: cfg.realtimeUrl, token: cfg.realtimeToken });
  })();
  return _busPromise;
}
