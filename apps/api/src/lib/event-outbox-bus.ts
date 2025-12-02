import type { EventBus } from "@Faworra/realtime";
import type { RTEvent } from "@Faworra/realtime/events";
import { eventOutbox } from "@Faworra/database/schema";
import type { db } from "@Faworra/database/client";

export function createEventOutboxBus(database: typeof db): EventBus {
  return {
    async publish(event: RTEvent): Promise<void> {
      const teamId = (event as unknown as { teamId?: string }).teamId;
      const threadId = (event as unknown as { threadId?: string }).threadId;
      await database.insert(eventOutbox).values({
        teamId: teamId!,
        threadId: threadId ?? null,
        eventType: event.type,
        payload: event as unknown as Record<string, unknown>,
        status: "queued",
        nextAttemptAt: new Date(),
      });
    },
  };
}
