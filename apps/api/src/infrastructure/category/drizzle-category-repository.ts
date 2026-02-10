import { categories } from "../db/schema.js";
import { getCurrentTransaction } from "../db/transaction-context.js";
import type { CategoryRepository } from "../../domain/category/category-repository.js";
import type { Category } from "../../domain/category/category.js";

export class DrizzleCategoryRepository implements CategoryRepository {
  async save(category: Category): Promise<void> {
    const tx = getCurrentTransaction();
    await tx.insert(categories).values({
      id: category.id,
      name: category.name.value,
    });
  }
}
