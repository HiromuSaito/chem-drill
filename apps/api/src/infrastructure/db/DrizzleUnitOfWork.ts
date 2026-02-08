import type { UnitOfWork } from "../../application/UnitOfWork.js";
import type { Database, Transaction } from "./client.js";

export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Database) {}

  async run<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(work);
  }
}
