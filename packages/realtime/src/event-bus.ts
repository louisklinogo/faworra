import type { RTEvent } from "./events";

export interface EventBus {
  publish(event: RTEvent): Promise<void>;
}

export type { RTEvent };
