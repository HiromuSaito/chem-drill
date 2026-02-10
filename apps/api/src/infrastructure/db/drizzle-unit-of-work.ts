import type { UnitOfWork } from "../../application/unit-of-work.js";
import type { Database } from "./client.js";
import { runInTransaction } from "./transaction-context.js";

export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Database) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    return runInTransaction(this.db, work);
  }
}
