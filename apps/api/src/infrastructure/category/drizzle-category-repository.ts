import { eq } from "drizzle-orm";
import { categories } from "../db/schema.js";
import { getCurrentTransaction } from "../db/transaction-context.js";
import type { CategoryRepository } from "../../domain/category/category-repository.js";
import type { CategoryId } from "../../domain/category/category-id.js";
import { Category } from "../../domain/category/category.js";
import { CategoryName } from "../../domain/category/category-name.js";
import { Id } from "../../domain/id.js";

export class DrizzleCategoryRepository implements CategoryRepository {
  async save(category: Category): Promise<void> {
    const tx = getCurrentTransaction();
    await tx
      .insert(categories)
      .values({
        id: category.id,
        name: category.name.value,
      })
      .onConflictDoUpdate({
        target: categories.id,
        set: { name: category.name.value },
      });
  }

  async findById(id: CategoryId): Promise<Category | null> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return Category.create({
      id: Id.of<Category>(row.id),
      name: CategoryName.create(row.name),
    });
  }

  async delete(id: CategoryId): Promise<void> {
    const tx = getCurrentTransaction();
    await tx.delete(categories).where(eq(categories.id, id));
  }
}
