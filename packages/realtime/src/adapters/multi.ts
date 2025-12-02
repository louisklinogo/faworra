import type { EventBus } from "../event-bus";
import type { RTEvent } from "../events";

export class MultiBus implements EventBus {
  private buses: EventBus[];
  constructor(buses: EventBus[]) {
    this.buses = buses;
  }
  async publish(event: RTEvent): Promise<void> {
    await Promise.allSettled(this.buses.map((b) => b.publish(event)));
  }
}

export function createMultiBus(buses: EventBus[]): EventBus {
  return new MultiBus(buses);
}
