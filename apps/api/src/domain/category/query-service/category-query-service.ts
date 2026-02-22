import type { CategoryId } from "../entity/category.ts";
import type { CategoryName } from "../value-object/category-name.ts";

export type CategoryDto = {
  id: string;
  name: string;
  questionCount: number;
};

export interface CategoryQueryService {
  findAll(): Promise<CategoryDto[]>;
  existsByName(name: CategoryName): Promise<boolean>;
  hasRelatedData(id: CategoryId): Promise<boolean>;
}
