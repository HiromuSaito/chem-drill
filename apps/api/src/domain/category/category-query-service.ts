import type { CategoryName } from "./category-name.js";

export type CategoryDto = {
  id: string;
  name: string;
};

export interface CategoryQueryService {
  findAll(): Promise<CategoryDto[]>;
  existsByName(name: CategoryName): Promise<boolean>;
}
