import { AsyncLocalStorage } from "node:async_hooks";
import type { Database, Transaction } from "./client.js";

const transactionStorage = new AsyncLocalStorage<Transaction>();

export function getCurrentTransaction(): Transaction {
  const tx = transactionStorage.getStore();
  if (!tx) {
    throw new Error(
      "No active transaction. Wrap your operation in UnitOfWork.run().",
    );
  }
  return tx;
}

export function runInTransaction<T>(
  db: Database,
  work: () => Promise<T>,
): Promise<T> {
  return db.transaction((tx) => transactionStorage.run(tx, work));
}
