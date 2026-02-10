import type { Transaction } from "../../infrastructure/db/client.js";
import type { Category } from "./category.js";

export interface CategoryRepository {
  save(tx: Transaction, category: Category): Promise<void>;
}
