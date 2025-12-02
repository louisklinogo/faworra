import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { channels } from "../channels";
import type { EventBus } from "../event-bus";
import type { RTEvent } from "../events";

// Cache Supabase channels per client+name to avoid subscribe/unsubscribe on every publish.
// Idle channels are auto-unsubscribed after idleMs without incoming publishes.
const channelCache = new WeakMap<SupabaseClient, Map<string, { ch: RealtimeChannel; subscribed: boolean; timer: any }>>();
const idleMs = 10_000;

async function getChannel(client: SupabaseClient, channelName: string): Promise<RealtimeChannel> {
  let map = channelCache.get(client);
  if (!map) { map = new Map(); channelCache.set(client, map); }
  const existing = map.get(channelName);
  if (existing && existing.subscribed) {
    if (existing.timer) clearTimeout(existing.timer);
    existing.timer = setTimeout(() => {
      try { existing.ch.unsubscribe(); } catch {}
      map!.delete(channelName);
    }, idleMs);
    return existing.ch;
  }
  const ch = client.channel(channelName);
  const entry = { ch, subscribed: false, timer: null as any };
  map.set(channelName, entry);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      try { ch.unsubscribe(); } catch {}
      map!.delete(channelName);
      reject(new Error("supabase subscribe timeout"));
    }, 1500);
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        entry.subscribed = true;
        entry.timer = setTimeout(() => {
          try { ch.unsubscribe(); } catch {}
          map!.delete(channelName);
        }, idleMs);
        resolve();
      }
    });
  });
  return entry.ch;
}

async function broadcast(
  client: SupabaseClient,
  channelName: string,
  event: string,
  payload: unknown,
): Promise<void> {
  const ch = await getChannel(client, channelName);
  await ch.send({ type: "broadcast", event, payload });
}

export function createSupabaseBus(client: SupabaseClient): EventBus {
  return {
    async publish(event: RTEvent): Promise<void> {
      switch (event.type) {
        case "message.created":
          await broadcast(client, channels.thread(event.threadId), event.type, { ...event.message, threadId: event.threadId, teamId: event.teamId });
          return;
        case "message.updated":
          await broadcast(client, channels.thread(event.threadId), event.type, { ...event.message, threadId: event.threadId, teamId: event.teamId });
          return;
        case "message.read":
          await broadcast(client, channels.thread(event.threadId), event.type, { threadId: event.threadId, teamId: event.teamId });
          return;
        case "conversation.typing_on":
        case "conversation.typing_off":
          await broadcast(client, channels.thread(event.threadId), event.type, { user: (event as any).user, conversation: { id: event.threadId }, threadId: event.threadId, teamId: event.teamId });
          return;
        case "conversation.updated":
        case "conversation.status_changed":
        case "conversation.read":
        case "assignee.changed":
        case "team.changed":
          await broadcast(client, channels.thread(event.threadId), event.type, { conversation: event.conversation, threadId: event.threadId, teamId: event.teamId });
          return;
        // no default
      }
    },
  };
}
