import type { UnitOfWork } from "../../application/unit-of-work.ts";
import type { Database } from "./client.ts";
import { runInTransaction } from "./transaction-context.ts";

export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Database) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    return runInTransaction(this.db, work);
  }
}
