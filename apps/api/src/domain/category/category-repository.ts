import type { Category } from "./category.js";
import type { CategoryId } from "./category-id.js";

export interface CategoryRepository {
  save(category: Category): Promise<void>;
  findById(id: CategoryId): Promise<Category | null>;
  delete(id: CategoryId): Promise<void>;
}
