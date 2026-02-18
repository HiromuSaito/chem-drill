import type { Category, CategoryId } from "../entity/category.ts";

export interface CategoryRepository {
  save(category: Category): Promise<void>;
  findById(id: CategoryId): Promise<Category | null>;
  delete(id: CategoryId): Promise<void>;
}
