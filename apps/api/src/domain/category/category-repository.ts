import type { Category } from "./category.js";

export interface CategoryRepository {
  save(category: Category): Promise<void>;
}
