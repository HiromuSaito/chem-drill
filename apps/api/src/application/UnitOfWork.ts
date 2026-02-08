import type { Transaction } from "../infrastructure/db/client.js";

export interface UnitOfWork {
  run<T>(work: (tx: Transaction) => Promise<T>): Promise<T>;
}
