import { eq } from "drizzle-orm";
import { categories } from "../db/schema.js";
import { getCurrentTransaction } from "../db/transaction-context.js";
import type {
  CategoryQueryService,
  CategoryDto,
} from "../../domain/category/category-query-service.js";
import type { CategoryName } from "../../domain/category/category-name.js";

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

  async existsByName(name: CategoryName): Promise<boolean> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, name.value))
      .limit(1);
    return rows.length > 0;
  }
}
