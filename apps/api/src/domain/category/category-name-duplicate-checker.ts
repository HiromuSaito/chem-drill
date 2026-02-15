import { DomainConflictError } from "../errors.js";
import type { CategoryName } from "./category-name.js";
import type { CategoryQueryService } from "./category-query-service.js";

export class CategoryNameDuplicateChecker {
  constructor(private queryService: CategoryQueryService) {}

  async ensure(name: CategoryName): Promise<void> {
    const exists = await this.queryService.existsByName(name);
    if (exists) {
      throw new DomainConflictError(
        `カテゴリ名「${name.value}」は既に使用されています`,
      );
    }
  }
}
