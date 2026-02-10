import { categories } from "../db/schema.js";
import { getCurrentTransaction } from "../db/transaction-context.js";
import type {
  CategoryQueryService,
  CategoryDto,
} from "../../domain/category/category-query-service.js";

export class DrizzleCategoryQueryService implements CategoryQueryService {
  async findAll(): Promise<CategoryDto[]> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories);

    return rows;
  }
}
