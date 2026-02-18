import type { Category } from "../../../domain/category/entity/category.ts";

export type CategoryResponse = {
  id: string;
  name: string;
};

export function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    name: category.name.value,
  };
}
