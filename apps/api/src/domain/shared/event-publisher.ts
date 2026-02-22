import type { DomainEvent } from "./domain-event.ts";
import type { EventHandler } from "./event-handler.ts";

export interface EventPublisher {
  register<E extends DomainEvent<string, unknown>>(
    handler: EventHandler<E>,
  ): void;
  publish(event: DomainEvent<string, unknown>): Promise<void>;
}
