import type { DomainEvent } from "./domain-event.ts";

export interface EventHandler<E extends DomainEvent<string, unknown>> {
  readonly eventType: E["type"];
  handle(event: E): Promise<void>;
}
