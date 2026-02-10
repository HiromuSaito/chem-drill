import type { Transaction } from "../db/client.js";
import { categories } from "../db/schema.js";
import type {
  CategoryQueryService,
  CategoryDto,
} from "../../domain/category/category-query-service.js";

export class DrizzleCategoryQueryService implements CategoryQueryService {
  async findAll(tx: Transaction): Promise<CategoryDto[]> {
    const rows = await tx
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories);

    return rows;
  }
}
