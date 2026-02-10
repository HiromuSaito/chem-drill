import type { Transaction } from "../db/client.js";
import { categories } from "../db/schema.js";
import type { CategoryRepository } from "../../domain/category/category-repository.js";
import type { Category } from "../../domain/category/category.js";

export class DrizzleCategoryRepository implements CategoryRepository {
  async save(tx: Transaction, category: Category): Promise<void> {
    await tx.insert(categories).values({
      id: category.id,
      name: category.name.value,
    });
  }
}
