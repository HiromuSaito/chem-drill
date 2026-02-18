export type DomainEvent<T extends string, P> = {
  type: T;
  occurredAt: Date;
  payload: P;
};
