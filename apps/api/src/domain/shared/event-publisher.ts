import type { DomainEvent } from "./domain-event.ts";

export interface EventPublisher {
  publish(event: DomainEvent<string, unknown>): Promise<void>;
}
