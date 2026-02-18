import { ConflictError } from "../../shared/errors.ts";
import type { CategoryName } from "../value-object/category-name.ts";
import type { CategoryQueryService } from "../query-service/category-query-service.ts";

export class CategoryNameDuplicateChecker {
  constructor(private queryService: CategoryQueryService) {}

  async ensure(name: CategoryName): Promise<void> {
    const exists = await this.queryService.existsByName(name);
    if (exists) {
      throw new ConflictError(
        `カテゴリ名「${name.value}」は既に使用されています`,
      );
    }
  }
}
